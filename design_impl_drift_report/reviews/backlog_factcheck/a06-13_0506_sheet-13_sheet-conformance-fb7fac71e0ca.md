# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a06-13_0506_sheet-13_sheet.json#a06-13_0506_sheet-13_sheet-conformance-fb7fac71e0ca`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a06-13_0506_sheet-13_sheet.json`
- sourceFindingId: `a06-13_0506_sheet-13_sheet-conformance-fb7fac71e0ca`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a06-13_0506_sheet-13_sheet` / A06-13 本人確認更新
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: リクエストの証明書IDで本人確認証明書マスタを引く。該当が無い場合は入力不正（HTTP 400）とし、エラーメッセージを返す。400 証明書IDが本人確認証明書マスタに存在しない（未指定を含む）場合は {code, errors}（errorsは「正しい証明書IDを入力してください」）を返す。
- implementationActual: identification が未指定の場合は MissingRequiredParameterException で HTTP 400 になるが、指定された証明書IDが mtb_identification に存在しない場合は NotFoundException('正しい証明書IDを入力してください') を投げる。NotFoundException は HTTP 404 として定義され、App API 例外リスナーが {code:404, errors:[...]} を返…
- mismatchReason: 設計は「証明書IDが本人確認証明書マスタに存在しない（未指定を含む）」を HTTP 400 と規定している。実装は未指定のみ 400、マスタ不存在は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288-290 で NotFoundException を投げ、/home/y-saito/De…
- designRefDetail: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-13:3430,3442,3453
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a06-13_0506_sheet-13_sheet-conformance-fb7fac71e0ca",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-13:3430,3442,3453",
  "designRefDetail": null,
  "designExpectation": "リクエストの証明書IDで本人確認証明書マスタを引く。該当が無い場合は入力不正（HTTP 400）とし、エラーメッセージを返す。400 証明書IDが本人確認証明書マスタに存在しない（未指定を含む）場合は {code, errors}（errorsは「正しい証明書IDを入力してください」）を返す。",
  "designQuote": "リクエストの証明書IDで本人確認証明書マスタを引く。該当が無い場合は入力不正（HTTP 400）とし、エラーメッセージを返す。400 証明書IDが本人確認証明書マスタに存在しない（未指定を含む）場合は {code, errors}（errorsは「正しい証明書IDを入力してください」）を返す。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288",
  "implementationActual": "identification が未指定の場合は MissingRequiredParameterException で HTTP 400 になるが、指定された証明書IDが mtb_identification に存在しない場合は NotFoundException('正しい証明書IDを入力してください') を投げる。NotFoundException は HTTP 404 として定義され、App API 例外リスナーが {code:404, errors:[...]} を返す。",
  "difference": "設計は「証明書IDが本人確認証明書マスタに存在しない（未指定を含む）」を HTTP 400 と規定している。実装は未指定のみ 400、マスタ不存在は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288-290 で NotFoundException を投げ、/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:27-31 により HTTP 404 となる。/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:81-139 で BaseApiException の statusCode をそのまま JSON 応答に使うため、設計の 400 と異なる。反証として InvalidParameterException/MissingRequiredParameterException/正しい証明書ID/identification で Controller・Exception・Listener・Service を再検索したが、存在しない証明書IDを 400 に変換する実装は見つからなかった。",
  "mismatchReason": "設計は「証明書IDが本人確認証明書マスタに存在しない（未指定を含む）」を HTTP 400 と規定している。実装は未指定のみ 400、マスタ不存在は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288-290 で NotFoundException を投げ、/home/y-saito/Developments/ec-cube-e…",
  "comparisonRows": [
    {
      "item": "証明書ID未指定",
      "design": "HTTP 400、errors は「正しい証明書IDを入力してください」",
      "implementation": "MissingRequiredParameterException('正しい証明書IDを入力してください') により HTTP 400",
      "mismatch": "なし"
    },
    {
      "item": "証明書IDがマスタに存在しない",
      "design": "HTTP 400、errors は「正しい証明書IDを入力してください」",
      "implementation": "NotFoundException('正しい証明書IDを入力してください') により HTTP 404",
      "mismatch": "HTTPステータスが 400 ではなく 404"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a06-13_0506_sheet-13_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「リクエストの証明書IDで本人確認証明書マスタを引く。該当が無い場合は入力不正（HTTP 400）とし、エラーメッセージを返す。400 証明書IDが本人確認証明書マスタに存在しない（未指定を含む）場合は {code, errors}（errorsは「正しい証明書IDを入力してください」）を返す。」。実装は「identification が未指定の場合は MissingRequiredParameterException で HTTP 400 になるが、指定された証明書IDが mtb_identification に存在しない場合は NotFoundException('正しい証明書IDを入力してください') を投げる。NotFoundException は HTTP 404 として定義され、App API 例外リスナーが {code:404, errors:[...]} を返す。」。乖離理由は「設計は「証明書IDが本人確認証明書マスタに存在しない（未指定を含む）」を HTTP 400 と規定している。実装は未指定のみ 400、マスタ不存在は /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288-290 で NotFoundException を投げ、/home/y-saito/Developments/ec-cube-e…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Form・入力項目",
    "Service・業務ルール",
    "CSV・API・Batch・PDF・印刷",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:288\n285: \n286:         $identificationId = (int) $raw;\n287: \n288:         $Identification = $this->mtbIdentificationRepository->find($identificationId);\n289:         if (!$Identification instanceof MtbIdentification) {\n290:             throw new NotFoundException('正しい証明書IDを入力してください');\n291:         }",
    "src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:52\n49: use Symfony\\Component\\Security\\Http\\Attribute\\IsGranted;\n50: \n51: #[IsGranted('IS_AUTHENTICATED_FULLY')]\n52: class OtcBuyOrderController extends AbstractController\n53: {\n54:     public function __construct(\n55:         private readonly UpdateFreeCommentAction $updateFreeCommentAction,"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

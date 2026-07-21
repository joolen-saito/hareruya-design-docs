# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json#b13-01_0413_sheet-3_sheet-conformance-36cb08c5003b`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b13-01_0413_sheet-3_sheet.json`
- sourceFindingId: `b13-01_0413_sheet-3_sheet-conformance-36cb08c5003b`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b13-01_0413_sheet-3_sheet` / B13-01 決済処理中チェックバッチ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: SP.LINKSに取引照会を行い、照会結果に応じた処理を行う。決済サービスへ取引を照会し、結果でステータスを判定する。
- implementationActual: getApiResponse() は SP.LINKS 取引照会APIを実行せず、常に LogicException を throw する。
- mismatchReason: PaymentStatusCheckAction::handle() は申込みごとに getApiResponse($paymentNo) を呼ぶが、同メソッド本体が「SP.LINKS取引照会API未実装」として例外を投げるため、設計上の取引照会・レスポンス判定・後続のステータス整合に到達できない。探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Payment, src/Eccube/Service/Payment, s…
- designRefDetail: excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:854,945
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b13-01_0413_sheet-3_sheet-conformance-36cb08c5003b",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0413_基本設計仕様書(バッチ_イベント).html#sheet-3:854,945",
  "designRefDetail": null,
  "designExpectation": "SP.LINKSに取引照会を行い、照会結果に応じた処理を行う。決済サービスへ取引を照会し、結果でステータスを判定する。",
  "designQuote": "SP.LINKSに取引照会を行い、照会結果に応じた処理を行う。決済サービスへ取引を照会し、結果でステータスを判定する。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191",
  "implementationActual": "getApiResponse() は SP.LINKS 取引照会APIを実行せず、常に LogicException を throw する。",
  "difference": "PaymentStatusCheckAction::handle() は申込みごとに getApiResponse($paymentNo) を呼ぶが、同メソッド本体が「SP.LINKS取引照会API未実装」として例外を投げるため、設計上の取引照会・レスポンス判定・後続のステータス整合に到達できない。探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Payment, src/Eccube/Service/Payment, src/Eccube/Repository, html。検索語: SP.LINKS, 取引照会, ResponseCd, MerchantId, getApiResponse, payment-status-check。",
  "mismatchReason": "PaymentStatusCheckAction::handle() は申込みごとに getApiResponse($paymentNo) を呼ぶが、同メソッド本体が「SP.LINKS取引照会API未実装」として例外を投げるため、設計上の取引照会・レスポンス判定・後続のステータス整合に到達できない。探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Payment, src/Eccube/Service/Payment, src/Eccube/Repository…",
  "comparisonRows": [
    {
      "item": "決済サービス照会",
      "design": "SP.LINKSに取引照会を行う",
      "implementation": "getApiResponse() が LogicException を throw する",
      "mismatch": "照会API本体が未実装"
    },
    {
      "item": "結果判定",
      "design": "照会結果でステータスを判定する",
      "implementation": "固定の OK/K02 等を判定する分岐はあるが、実レスポンス取得が存在しない",
      "mismatch": "外部契約である決済照会結果を取得できない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b13-01_0413_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「SP.LINKSに取引照会を行い、照会結果に応じた処理を行う。決済サービスへ取引を照会し、結果でステータスを判定する。」。実装は「getApiResponse() は SP.LINKS 取引照会APIを実行せず、常に LogicException を throw する。」。乖離理由は「PaymentStatusCheckAction::handle() は申込みごとに getApiResponse($paymentNo) を呼ぶが、同メソッド本体が「SP.LINKS取引照会API未実装」として例外を投げるため、設計上の取引照会・レスポンス判定・後続のステータス整合に到達できない。探索範囲: src/Eccube/Command, src/Eccube/Service/Admin/Payment, src/Eccube/Service/Payment, src/Eccube/Repository…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:191\n188:      *\n189:      * @return ?string\n190:      */\n191:     public function getApiResponse(?string $paymentNo): ?string\n192:     {\n193:         // SP.LINKS取引照会API未実装のため、後続PRで実装予定\n194:         throw new \\LogicException('SP.LINKS取引照会API未実装のため、決済処理中チェックはまだ実行できません。');",
    "src/Eccube/Service/Admin/Payment/PaymentStatusCheckAction.php:33\n30: use Symfony\\Component\\Lock\\LockFactory;\n31: use Symfony\\Component\\Lock\\Store\\FlockStore;\n32: \n33: class PaymentStatusCheckAction\n34: {\n35:     /**\n36:      * @var array<string,string>"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

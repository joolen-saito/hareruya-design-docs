# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b02-02_0404_sheet-4_sheet.json#b02-02_0404_sheet-4_sheet-conformance-9e3a769524a8`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b02-02_0404_sheet-4_sheet.json`
- sourceFindingId: `b02-02_0404_sheet-4_sheet-conformance-9e3a769524a8`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b02-02_0404_sheet-4_sheet` / B02-02 入荷通知キャンセル
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: コンソールのバッチコマンドは `product:batch deleteProductRequest` で実行する。コマンド名が一致しない場合は処理を行わずに終了する。
- implementationActual: Symfony Console コマンドは `eccube:cancel-product-request` として登録されている。`product:batch deleteProductRequest` の登録は探索範囲内に見つからない。
- mismatchReason: 設計は外部契約として `product:batch deleteProductRequest` を指定しているが、実装の AsCommand name は `eccube:cancel-product-request`。反証検索として `deleteProductRequest`、`product:batch`、`cancel-product-request`、`CancelProductRequestCommand` を src/Eccube/html/config/ap…
- designRefDetail: excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-4:1042
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:34

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b02-02_0404_sheet-4_sheet-conformance-9e3a769524a8",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html#sheet-4:1042",
  "designRefDetail": null,
  "designExpectation": "コンソールのバッチコマンドは `product:batch deleteProductRequest` で実行する。コマンド名が一致しない場合は処理を行わずに終了する。",
  "designQuote": "コンソールのバッチコマンドは `product:batch deleteProductRequest` で実行する。コマンド名が一致しない場合は処理を行わずに終了する。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:34",
  "implementationActual": "Symfony Console コマンドは `eccube:cancel-product-request` として登録されている。`product:batch deleteProductRequest` の登録は探索範囲内に見つからない。",
  "difference": "設計は外部契約として `product:batch deleteProductRequest` を指定しているが、実装の AsCommand name は `eccube:cancel-product-request`。反証検索として `deleteProductRequest`、`product:batch`、`cancel-product-request`、`CancelProductRequestCommand` を src/Eccube/html/config/app 配下で確認したが、設計コマンド名の別登録は不在。",
  "mismatchReason": "設計は外部契約として `product:batch deleteProductRequest` を指定しているが、実装の AsCommand name は `eccube:cancel-product-request`。反証検索として `deleteProductRequest`、`product:batch`、`cancel-product-request`、`CancelProductRequestCommand` を src/Eccube/html/config/app 配下で確認したが、設計コマンド名の別…",
  "comparisonRows": [
    {
      "item": "バッチ起動コマンド",
      "design": "product:batch deleteProductRequest",
      "implementation": "eccube:cancel-product-request",
      "mismatch": "外部から実行するコマンド名が設計と一致しない。"
    },
    {
      "item": "不一致コマンド時の扱い",
      "design": "コマンド名が一致しない場合は処理を行わずに終了する。",
      "implementation": "Symfony Console の別名コマンドとしてのみ登録され、設計名は存在しない。",
      "mismatch": "設計名で起動できないため、設計された入口契約を満たさない。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b02-02_0404_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:34",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「コンソールのバッチコマンドは `product:batch deleteProductRequest` で実行する。コマンド名が一致しない場合は処理を行わずに終了する。」。実装は「Symfony Console コマンドは `eccube:cancel-product-request` として登録されている。`product:batch deleteProductRequest` の登録は探索範囲内に見つからない。」。乖離理由は「設計は外部契約として `product:batch deleteProductRequest` を指定しているが、実装の AsCommand name は `eccube:cancel-product-request`。反証検索として `deleteProductRequest`、`product:batch`、`cancel-product-request`、`CancelProductRequestCommand` を src/Eccube/html/config/app 配下で確認したが、設計コマンド名の別…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php:34",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/CancelProductRequestCommand.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Command/CancelProductRequestCommand.php:34\n31:  *\n32:  *   bin/console eccube:cancel-product-request\n33:  */\n34: #[AsCommand(name: 'eccube:cancel-product-request', description: '入荷通知キャンセルバッチ')]\n35: class CancelProductRequestCommand extends Command\n36: {\n37:     public function __construct(private readonly BatchCancelProductRequestAction $batchCancelProductRequestAction)",
    "src/Eccube/Command/CancelProductRequestCommand.php:35\n32:  *   bin/console eccube:cancel-product-request\n33:  */\n34: #[AsCommand(name: 'eccube:cancel-product-request', description: '入荷通知キャンセルバッチ')]\n35: class CancelProductRequestCommand extends Command\n36: {\n37:     public function __construct(private readonly BatchCancelProductRequestAction $batchCancelProductRequestAction)\n38:     {"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

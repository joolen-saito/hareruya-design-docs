# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b05-03_0405_sheet-5_sheet.json#b05-03_0405_sheet-5_sheet-conformance-535d20f06099`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b05-03_0405_sheet-5_sheet.json`
- sourceFindingId: `b05-03_0405_sheet-5_sheet-conformance-535d20f06099`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b05-03_0405_sheet-5_sheet` / B05-03 店頭注文番号初期化
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: コンソールのバッチコマンド `order:batch truncateWaitingNumber` で店頭注文番号初期化を実行し、コマンド名が一致しない場合は処理を行わずに終了する。
- implementationActual: Symfony Console コマンドは `eccube:order:truncate-waiting-number` として登録されている。`order:batch truncateWaitingNumber` または alias 登録は確認できない。
- mismatchReason: 設計は利用者視点の入口として `order:batch truncateWaitingNumber` を外部契約化しているが、実装の `#[AsCommand]` 登録名は別名である。反証検索として `order:batch truncateWaitingNumber`、`truncateWaitingNumber`、`truncate-waiting-number`、`setAliases`、`aliases` を `src/Eccube`、`app`、`html` で確…
- designRefDetail: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-5:1330-1334
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b05-03_0405_sheet-5_sheet-conformance-535d20f06099",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-5:1330-1334",
  "designRefDetail": null,
  "designExpectation": "コンソールのバッチコマンド `order:batch truncateWaitingNumber` で店頭注文番号初期化を実行し、コマンド名が一致しない場合は処理を行わずに終了する。",
  "designQuote": "コンソールのバッチコマンド `order:batch truncateWaitingNumber` で店頭注文番号初期化を実行し、コマンド名が一致しない場合は処理を行わずに終了する。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25",
  "implementationActual": "Symfony Console コマンドは `eccube:order:truncate-waiting-number` として登録されている。`order:batch truncateWaitingNumber` または alias 登録は確認できない。",
  "difference": "設計は利用者視点の入口として `order:batch truncateWaitingNumber` を外部契約化しているが、実装の `#[AsCommand]` 登録名は別名である。反証検索として `order:batch truncateWaitingNumber`、`truncateWaitingNumber`、`truncate-waiting-number`、`setAliases`、`aliases` を `src/Eccube`、`app`、`html` で確認したが、設計コマンド名または alias は不在。",
  "mismatchReason": "設計は利用者視点の入口として `order:batch truncateWaitingNumber` を外部契約化しているが、実装の `#[AsCommand]` 登録名は別名である。反証検索として `order:batch truncateWaitingNumber`、`truncateWaitingNumber`、`truncate-waiting-number`、`setAliases`、`aliases` を `src/Eccube`、`app`、`html` で確認したが、設計コマンド名または alia…",
  "comparisonRows": [
    {
      "item": "バッチ入口",
      "design": "`order:batch truncateWaitingNumber`",
      "implementation": "`eccube:order:truncate-waiting-number`",
      "mismatch": "設計された起動コマンド名で実行できる根拠がない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b05-03_0405_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「コンソールのバッチコマンド `order:batch truncateWaitingNumber` で店頭注文番号初期化を実行し、コマンド名が一致しない場合は処理を行わずに終了する。」。実装は「Symfony Console コマンドは `eccube:order:truncate-waiting-number` として登録されている。`order:batch truncateWaitingNumber` または alias 登録は確認できない。」。乖離理由は「設計は利用者視点の入口として `order:batch truncateWaitingNumber` を外部契約化しているが、実装の `#[AsCommand]` 登録名は別名である。反証検索として `order:batch truncateWaitingNumber`、`truncateWaitingNumber`、`truncate-waiting-number`、`setAliases`、`aliases` を `src/Eccube`、`app`、`html` で確認したが、設計コマンド名または alia…」。",
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
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php:25",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/TruncateWaitingNumberCommand.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Command/TruncateWaitingNumberCommand.php:25\n22: use Symfony\\Component\\Console\\Output\\OutputInterface;\n23: use Symfony\\Component\\Console\\Style\\SymfonyStyle;\n24: \n25: #[AsCommand(name: 'eccube:order:truncate-waiting-number', description: '店舗注文番号初期化')]\n26: class TruncateWaitingNumberCommand extends Command\n27: {\n28:     public function __construct(",
    "src/Eccube/Command/TruncateWaitingNumberCommand.php:26\n23: use Symfony\\Component\\Console\\Style\\SymfonyStyle;\n24: \n25: #[AsCommand(name: 'eccube:order:truncate-waiting-number', description: '店舗注文番号初期化')]\n26: class TruncateWaitingNumberCommand extends Command\n27: {\n28:     public function __construct(\n29:         private readonly TruncateWaitingNumberAction $truncateWaitingNumberAction,"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

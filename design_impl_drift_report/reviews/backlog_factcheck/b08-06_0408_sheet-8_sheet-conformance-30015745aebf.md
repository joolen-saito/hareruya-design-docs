# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b08-06_0408_sheet-8_sheet.json#b08-06_0408_sheet-8_sheet-conformance-30015745aebf`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b08-06_0408_sheet-8_sheet.json`
- sourceFindingId: `b08-06_0408_sheet-8_sheet-conformance-30015745aebf`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b08-06_0408_sheet-8_sheet` / B08-06 スマレジ使用ポイント連携
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 購入完了処理や購入完了再処理から別プロセスとして呼び出される。
- implementationActual: 通常の購入完了処理では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:602-606` に別プロセス起動がある。一方、購入完了再処理に相当する管理受注更新系では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/Ed…
- mismatchReason: 設計は購入完了処理と購入完了再処理の双方から別プロセス呼び出しを要求している。反証検索で使用ポイント連携コマンドの呼び出し箇所は ShoppingController の1件のみで、再処理側の起動実装は確認できなかった。
- designRefDetail: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1685
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: SmaregiUpdatePoint, update-point, updatePoint, smaregi:batch, eccube:smaregi:update-point, Process::fromShellComman…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b08-06_0408_sheet-8_sheet-conformance-30015745aebf",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1685",
  "designRefDetail": null,
  "designExpectation": "購入完了処理や購入完了再処理から別プロセスとして呼び出される。",
  "designQuote": "購入完了処理や購入完了再処理から別プロセスとして呼び出される。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: SmaregiUpdatePoint, update-point, updatePoint, smaregi:batch, eccube:smaregi:update-point, Process::fromShellCommandline, 再処理, reprocess）",
  "implementationActual": "通常の購入完了処理では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:602-606` に別プロセス起動がある。一方、購入完了再処理に相当する管理受注更新系では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:627-630` と `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:798-801` に発生ポイント連携はあるが、使用ポイント連携バッチの別プロセス起動はない。",
  "difference": "設計は購入完了処理と購入完了再処理の双方から別プロセス呼び出しを要求している。反証検索で使用ポイント連携コマンドの呼び出し箇所は ShoppingController の1件のみで、再処理側の起動実装は確認できなかった。",
  "mismatchReason": "設計は購入完了処理と購入完了再処理の双方から別プロセス呼び出しを要求している。反証検索で使用ポイント連携コマンドの呼び出し箇所は ShoppingController の1件のみで、再処理側の起動実装は確認できなかった。",
  "comparisonRows": [
    {
      "item": "購入完了処理からの起動",
      "design": "別プロセスで呼び出す。",
      "implementation": "ShoppingController で `nohup php ... eccube:smaregi:update-point` を起動。",
      "mismatch": "実装あり。ただしコマンド名は別指摘のとおり設計と異なる。"
    },
    {
      "item": "購入完了再処理からの起動",
      "design": "別プロセスで呼び出す。",
      "implementation": "使用ポイント連携バッチの起動なし。",
      "mismatch": "再処理側の呼び出しが未実装。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b08-06_0408_sheet-8_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: SmaregiUpdatePoint, update-point, updatePoint, smaregi:batch, eccube:smaregi:update-point, Process::fromShellCommandline, 再処理, reprocess）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「購入完了処理や購入完了再処理から別プロセスとして呼び出される。」。実装は「通常の購入完了処理では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:602-606` に別プロセス起動がある。一方、購入完了再処理に相当する管理受注更新系では `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:627…」。乖離理由は「設計は購入完了処理と購入完了再処理の双方から別プロセス呼び出しを要求している。反証検索で使用ポイント連携コマンドの呼び出し箇所は ShoppingController の1件のみで、再処理側の起動実装は確認できなかった。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: SmaregiUpdatePoint, update-point, updatePoint, smaregi:batch, eccube:smaregi:update-point, Process::fromShellCommandline, 再処理, reprocess）"
  ],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

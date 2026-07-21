# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b08-06_0408_sheet-8_sheet.json#b08-06_0408_sheet-8_sheet-conformance-8f137fc2f6f8`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b08-06_0408_sheet-8_sheet.json`
- sourceFindingId: `b08-06_0408_sheet-8_sheet-conformance-8f137fc2f6f8`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b08-06_0408_sheet-8_sheet` / B08-06 スマレジ使用ポイント連携
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 失敗時はエラー状態を残し、スマレジEC受注連携エラー再連携バッチで再試行できる。
- implementationActual: 失敗時のエラー保存は `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:57-60` と `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:75-78` にある。`s…
- mismatchReason: 設計は失敗記録だけでなく後続のスマレジEC受注連携エラー再連携バッチによる再試行可能性まで要求している。実装はエラー受注抽出メソッド止まりで、使用ポイント連携を再試行するバッチ入口・Action・呼び出しが不在。なお `SmaregiStockBackfillCommand` は在庫変動Webhook再連携であり、使用ポイント連携の再試行ではない。
- designRefDetail: excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1714,1730
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: getSmaregiErrorOrder, point_error_message, smaregi_error_flg, エラー再連携, 再試行, retry, SmaregiUpdatePointAction）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b08-06_0408_sheet-8_sheet-conformance-8f137fc2f6f8",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0408_基本設計仕様書(バッチ_会員).html#sheet-8:1714,1730",
  "designRefDetail": null,
  "designExpectation": "失敗時はエラー状態を残し、スマレジEC受注連携エラー再連携バッチで再試行できる。",
  "designQuote": "失敗時はエラー状態を残し、スマレジEC受注連携エラー再連携バッチで再試行できる。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: getSmaregiErrorOrder, point_error_message, smaregi_error_flg, エラー再連携, 再試行, retry, SmaregiUpdatePointAction）",
  "implementationActual": "失敗時のエラー保存は `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:57-60` と `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:75-78` にある。`smaregi_error_flg = 1` の受注取得メソッドは `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:877-885` にあるが、このメソッドを呼び出すコマンド/サービスは見つからない。",
  "difference": "設計は失敗記録だけでなく後続のスマレジEC受注連携エラー再連携バッチによる再試行可能性まで要求している。実装はエラー受注抽出メソッド止まりで、使用ポイント連携を再試行するバッチ入口・Action・呼び出しが不在。なお `SmaregiStockBackfillCommand` は在庫変動Webhook再連携であり、使用ポイント連携の再試行ではない。",
  "mismatchReason": "設計は失敗記録だけでなく後続のスマレジEC受注連携エラー再連携バッチによる再試行可能性まで要求している。実装はエラー受注抽出メソッド止まりで、使用ポイント連携を再試行するバッチ入口・Action・呼び出しが不在。なお `SmaregiStockBackfillCommand` は在庫変動Webhook再連携であり、使用ポイント連携の再試行ではない。",
  "comparisonRows": [
    {
      "item": "失敗時のエラー状態保存",
      "design": "エラーメッセージとエラーフラグを残す。",
      "implementation": "`point_error_message` と `smaregi_error_flg` を保存。",
      "mismatch": "実装あり。"
    },
    {
      "item": "後続再連携対象化",
      "design": "スマレジEC受注連携エラー再連携バッチで再試行できる。",
      "implementation": "エラー受注取得メソッドはあるが、使用ポイント連携を再試行するバッチ/Action がない。",
      "mismatch": "再試行経路が未実装。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b08-06_0408_sheet-8_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: getSmaregiErrorOrder, point_error_message, smaregi_error_flg, エラー再連携, 再試行, retry, SmaregiUpdatePointAction）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「失敗時はエラー状態を残し、スマレジEC受注連携エラー再連携バッチで再試行できる。」。実装は「失敗時のエラー保存は `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:57-60` と `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiUpdatePointAction.php:75-78` にある。`smaregi_error_flg = 1…」。乖離理由は「設計は失敗記録だけでなく後続のスマレジEC受注連携エラー再連携バッチによる再試行可能性まで要求している。実装はエラー受注抽出メソッド止まりで、使用ポイント連携を再試行するバッチ入口・Action・呼び出しが不在。なお `SmaregiStockBackfillCommand` は在庫変動Webhook再連携であり、使用ポイント連携の再試行ではない。」。",
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
    "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube, /home/y-saito/Developments/ec-cube-enterprise/html; 検索語: getSmaregiErrorOrder, point_error_message, smaregi_error_flg, エラー再連携, 再試行, retry, SmaregiUpdatePointAction）"
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

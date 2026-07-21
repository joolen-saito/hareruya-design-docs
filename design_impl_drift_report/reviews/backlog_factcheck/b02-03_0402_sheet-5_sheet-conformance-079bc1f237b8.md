# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0402_sheet-5_sheet.json#b02-03_0402_sheet-5_sheet-conformance-079bc1f237b8`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b02-03_0402_sheet-5_sheet.json`
- sourceFindingId: `b02-03_0402_sheet-5_sheet-conformance-079bc1f237b8`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b02-03_0402_sheet-5_sheet` / B02-03 期間別入庫数集計バッチ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: エラーが発生した場合、集計できなかった旨をメールで送信する。
- implementationActual: AggregateStockUpCommand は例外時にコンソールへ error() を出力して FAILURE を返すだけで、BatchAggregateStockUpAction に MailService 等のメール送信依存もない。MailService には週間在庫履歴更新など他バッチ向けのエラー通知はあるが、期間別入庫数集計向けの送信処理は見つからない。
- mismatchReason: 「集計できなかった旨をメールで送信する」実装が当該コマンド・サービス・リポジトリ・MailService に存在しない。別キーワード（集計できなかった、期間別入庫、stock up、AggregateStockUp、MailService、send）でも反証できなかった。
- designRefDetail: excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1172
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b02-03_0402_sheet-5_sheet-conformance-079bc1f237b8",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0402_基本設計仕様書(バッチ_在庫管理).html#sheet-5:1172",
  "designRefDetail": null,
  "designExpectation": "エラーが発生した場合、集計できなかった旨をメールで送信する。",
  "designQuote": "エラーが発生した場合、集計できなかった旨をメールで送信する。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository）",
  "implementationActual": "AggregateStockUpCommand は例外時にコンソールへ error() を出力して FAILURE を返すだけで、BatchAggregateStockUpAction に MailService 等のメール送信依存もない。MailService には週間在庫履歴更新など他バッチ向けのエラー通知はあるが、期間別入庫数集計向けの送信処理は見つからない。",
  "difference": "「集計できなかった旨をメールで送信する」実装が当該コマンド・サービス・リポジトリ・MailService に存在しない。別キーワード（集計できなかった、期間別入庫、stock up、AggregateStockUp、MailService、send）でも反証できなかった。",
  "mismatchReason": "「集計できなかった旨をメールで送信する」実装が当該コマンド・サービス・リポジトリ・MailService に存在しない。別キーワード（集計できなかった、期間別入庫、stock up、AggregateStockUp、MailService、send）でも反証できなかった。",
  "comparisonRows": [
    {
      "item": "エラー通知",
      "design": "エラー時に集計できなかった旨をメール送信",
      "implementation": "コンソールへ「集計処理でエラーが発生しました: ...」を出力",
      "mismatch": "メール送信が未実装。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b02-03_0402_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「エラーが発生した場合、集計できなかった旨をメールで送信する。」。実装は「AggregateStockUpCommand は例外時にコンソールへ error() を出力して FAILURE を返すだけで、BatchAggregateStockUpAction に MailService 等のメール送信依存もない。MailService には週間在庫履歴更新など他バッチ向けのエラー通知はあるが、期間別入庫数集計向けの送信処理は見つからない。」。乖離理由は「「集計できなかった旨をメールで送信する」実装が当該コマンド・サービス・リポジトリ・MailService に存在しない。別キーワード（集計できなかった、期間別入庫、stock up、AggregateStockUp、MailService、send）でも反証できなかった。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Service・業務ルール",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository）"
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

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b05-01_0405_sheet-3_sheet.json#b05-01_0405_sheet-3_sheet-conformance-0a182b493c16`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b05-01_0405_sheet-3_sheet.json`
- sourceFindingId: `b05-01_0405_sheet-3_sheet-conformance-0a182b493c16`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b05-01_0405_sheet-3_sheet` / B05-01 注文番号登録
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: スマレジ連携APIの実行に失敗した場合はエラーメールを送信し、送信先は追加設定のスマレジ通信エラー送信メールアドレスとする。
- implementationActual: API失敗時は `smaregi_error_flg` を true にして logger/MessengerJob errorMessage に記録するのみで、メール送信処理と送信先設定の参照がない。
- mismatchReason: 設計が要求するエラーメール送信と追加設定メールアドレス参照が、OTCスマレジ連携コマンド・同期サービス・メッセージハンドラ周辺に存在しない。
- designRefDetail: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:972-979,1002-1004
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php, src/Eccube/Service/Smaregi, src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php, src/Eccube/Repository/OrderRepository.php; 検索…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b05-01_0405_sheet-3_sheet-conformance-0a182b493c16",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-3:972-979,1002-1004",
  "designRefDetail": null,
  "designExpectation": "スマレジ連携APIの実行に失敗した場合はエラーメールを送信し、送信先は追加設定のスマレジ通信エラー送信メールアドレスとする。",
  "designQuote": "スマレジ連携APIの実行に失敗した場合はエラーメールを送信し、送信先は追加設定のスマレジ通信エラー送信メールアドレスとする。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php, src/Eccube/Service/Smaregi, src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php, src/Eccube/Repository/OrderRepository.php; 検索語: スマレジ通信エラー, 通信エラー送信, エラーメール, smaregi mail, MailService, sendMail, send）",
  "implementationActual": "API失敗時は `smaregi_error_flg` を true にして logger/MessengerJob errorMessage に記録するのみで、メール送信処理と送信先設定の参照がない。",
  "difference": "設計が要求するエラーメール送信と追加設定メールアドレス参照が、OTCスマレジ連携コマンド・同期サービス・メッセージハンドラ周辺に存在しない。",
  "mismatchReason": "設計が要求するエラーメール送信と追加設定メールアドレス参照が、OTCスマレジ連携コマンド・同期サービス・メッセージハンドラ周辺に存在しない。",
  "comparisonRows": [
    {
      "item": "商品連携失敗",
      "design": "エラーメールを追加設定のスマレジ通信エラー送信メールアドレスへ送信",
      "implementation": "`markError()` でログ出力と `smaregi_error_flg=true` のみ",
      "mismatch": "メール送信がない"
    },
    {
      "item": "在庫連携失敗",
      "design": "エラーメールを追加設定のスマレジ通信エラー送信メールアドレスへ送信",
      "implementation": "`markError()` でログ出力と `smaregi_error_flg=true` のみ",
      "mismatch": "メール送信がない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b05-01_0405_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php, src/Eccube/Service/Smaregi, src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php, src/Eccube/Repository/OrderRepository.php; 検索語: スマレジ通信エラー, 通信エラー送信, エラーメール, smaregi mail, MailService, sendMail, send）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「スマレジ連携APIの実行に失敗した場合はエラーメールを送信し、送信先は追加設定のスマレジ通信エラー送信メールアドレスとする。」。実装は「API失敗時は `smaregi_error_flg` を true にして logger/MessengerJob errorMessage に記録するのみで、メール送信処理と送信先設定の参照がない。」。乖離理由は「設計が要求するエラーメール送信と追加設定メールアドレス参照が、OTCスマレジ連携コマンド・同期サービス・メッセージハンドラ周辺に存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "CSV・API・Batch・PDF・印刷",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php",
    "src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php",
    "src/Eccube/Repository/OrderRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Command/OtcOrderSmaregiPostCommand.php:26\n23: use Symfony\\Component\\Console\\Style\\SymfonyStyle;\n24: \n25: #[AsCommand(name: 'eccube:order:otc-smaregi-post', description: '店頭受取注文のスマレジ連携バッチ')]\n26: class OtcOrderSmaregiPostCommand extends Command\n27: {\n28:     public function __construct(\n29:         private readonly SmaregiOtcOrderPostAction $smaregiOtcOrderPostAction,",
    "src/Eccube/MessageHandler/SmaregiOtcSyncMessageHandler.php:43\n40:  * (Symfony Messenger の自動リトライを使わず、運用側で FAILED ジョブを再投入する想定)。\n41:  */\n42: #[AsMessageHandler]\n43: final readonly class SmaregiOtcSyncMessageHandler\n44: {\n45:     public function __construct(\n46:         private LoggerInterface $logger,",
    "src/Eccube/Repository/OrderRepository.php:57\n54:  *\n55:  * @extends AbstractEnterpriseRepository<Order>\n56:  */\n57: class OrderRepository extends AbstractEnterpriseRepository implements ServiceEntityRepositoryInterface\n58: {\n59:     use SortProductTrait;\n60: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

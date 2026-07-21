# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b05-04_0405_sheet-6_sheet.json#b05-04_0405_sheet-6_sheet-conformance-49eca82ef18e`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b05-04_0405_sheet-6_sheet.json`
- sourceFindingId: `b05-04_0405_sheet-6_sheet-conformance-49eca82ef18e`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b05-04_0405_sheet-6_sheet` / B05-04 スマレジ商品再連携
- issueCategory: 実装違い
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: スマレジ商品再連携はコンソールコマンド order:batch resendSmaregiProduct で実行し、スマレジ商品コード登録済み・スマレジ削除フラグ未設定・スマレジ商品連携または在庫連携が未連携の注文を対象に、未連携区分のみ再連携する。
- implementationActual: 実行可能な関連コマンドは eccube:order:otc-smaregi-post で、SmaregiOtcOrderPostAction は findTargetOrdersForSmaregiPost() を呼ぶ。設計条件に近い getResendSmaregiProduct() は存在するが、src/Eccube と html 内で呼び出し元が見つからない。
- mismatchReason: 設計の入口 order:batch resendSmaregiProduct が実装されていない。実際の callable 経路は初回/通常の店頭受取スマレジ連携に見え、抽出条件も smaregi_product_flg=false かつ smaregi_stock_flg=false の AND であり、設計の「商品または在庫の未連携区分のみ再連携」と一致しない。反証として resendSmaregiProduct、商品再連携、再送信対象、getResendSmaregi…
- designRefDetail: excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-6:1476,1481,1487,1490
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:42, /home/y-saito/Developments/ec-cu…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b05-04_0405_sheet-6_sheet-conformance-49eca82ef18e",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html#sheet-6:1476,1481,1487,1490",
  "designRefDetail": null,
  "designExpectation": "スマレジ商品再連携はコンソールコマンド order:batch resendSmaregiProduct で実行し、スマレジ商品コード登録済み・スマレジ削除フラグ未設定・スマレジ商品連携または在庫連携が未連携の注文を対象に、未連携区分のみ再連携する。",
  "designQuote": "スマレジ商品再連携はコンソールコマンド order:batch resendSmaregiProduct で実行し、スマレジ商品コード登録済み・スマレジ削除フラグ未設定・スマレジ商品連携または在庫連携が未連携の注文を対象に、未連携区分のみ再連携する。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:42, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:741, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1798",
  "implementationActual": "実行可能な関連コマンドは eccube:order:otc-smaregi-post で、SmaregiOtcOrderPostAction は findTargetOrdersForSmaregiPost() を呼ぶ。設計条件に近い getResendSmaregiProduct() は存在するが、src/Eccube と html 内で呼び出し元が見つからない。",
  "difference": "設計の入口 order:batch resendSmaregiProduct が実装されていない。実際の callable 経路は初回/通常の店頭受取スマレジ連携に見え、抽出条件も smaregi_product_flg=false かつ smaregi_stock_flg=false の AND であり、設計の「商品または在庫の未連携区分のみ再連携」と一致しない。反証として resendSmaregiProduct、商品再連携、再送信対象、getResendSmaregiProduct、findOtcOrdersAwaitingSmaregiSync、SmaregiOtcSyncMessage 経路を検索したが、B05-04 コマンド入口への接続は確認できなかった。",
  "mismatchReason": "設計の入口 order:batch resendSmaregiProduct が実装されていない。実際の callable 経路は初回/通常の店頭受取スマレジ連携に見え、抽出条件も smaregi_product_flg=false かつ smaregi_stock_flg=false の AND であり、設計の「商品または在庫の未連携区分のみ再連携」と一致しない。反証として resendSmaregiProduct、商品再連携、再送信対象、getResendSmaregiProduct、findOtcOrder…",
  "comparisonRows": [
    {
      "item": "コマンド入口",
      "design": "order:batch resendSmaregiProduct",
      "implementation": "eccube:order:otc-smaregi-post",
      "mismatch": "設計コマンド名の入口がない。"
    },
    {
      "item": "対象抽出",
      "design": "smaregi_code 登録済み、smaregi_del_flg=false、smaregi_product_flg=false または smaregi_stock_flg=false",
      "implementation": "実行経路は findTargetOrdersForSmaregiPost() で order_date 条件、店舗ID/店舗コード、配送、両フラグ false、order_number、注文ステータスを条件化。getResendSmaregiProduct() は設計条件に近いが未使用。",
      "mismatch": "設計の再連携対象抽出が callable 経路になっていない。"
    },
    {
      "item": "未連携区分のみ再連携",
      "design": "商品未連携なら商品、在庫未連携なら在庫を対象区分に加える。",
      "implementation": "SmaregiOtcOrderSyncService はフラグ別に商品/在庫を処理できるが、B05-04 の設計コマンドから呼ばれていない。",
      "mismatch": "処理部品はあるが設計入口からの一連のバッチとして成立していない。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b05-04_0405_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:42, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:741, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1798",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「スマレジ商品再連携はコンソールコマンド order:batch resendSmaregiProduct で実行し、スマレジ商品コード登録済み・スマレジ削除フラグ未設定・スマレジ商品連携または在庫連携が未連携の注文を対象に、未連携区分のみ再連携する。」。実装は「実行可能な関連コマンドは eccube:order:otc-smaregi-post で、SmaregiOtcOrderPostAction は findTargetOrdersForSmaregiPost() を呼ぶ。設計条件に近い getResendSmaregiProduct() は存在するが、src/Eccube と html 内で呼び出し元が見つからない。」。乖離理由は「設計の入口 order:batch resendSmaregiProduct が実装されていない。実際の callable 経路は初回/通常の店頭受取スマレジ連携に見え、抽出条件も smaregi_product_flg=false かつ smaregi_stock_flg=false の AND であり、設計の「商品または在庫の未連携区分のみ再連携」と一致しない。反証として resendSmaregiProduct、商品再連携、再送信対象、getResendSmaregiProduct、findOtcOrder…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "auditAspects": [
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:42",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:741",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1798",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command/OtcOrderSmaregiPostCommand.php",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Command/OtcOrderSmaregiPostCommand.php:25\n22: use Symfony\\Component\\Console\\Output\\OutputInterface;\n23: use Symfony\\Component\\Console\\Style\\SymfonyStyle;\n24: \n25: #[AsCommand(name: 'eccube:order:otc-smaregi-post', description: '店頭受取注文のスマレジ連携バッチ')]\n26: class OtcOrderSmaregiPostCommand extends Command\n27: {\n28:     public function __construct(",
    "src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:42\n39:     public function handle(\\DateTime $targetDateTime): void\n40:     {\n41:         // 対象受注を取得\n42:         $Orders = $this->orderRepository->findTargetOrdersForSmaregiPost($targetDateTime);\n43: \n44:         if ($Orders === []) {\n45:             log_info('対象受注はありません。', ['targetDateTime' => $targetDateTime]);",
    "src/Eccube/Repository/OrderRepository.php:741\n738:     /**\n739:      * スマレジ再送信対象の受注を取得\n740:      */\n741:     public function getResendSmaregiProduct(): mixed\n742:     {\n743:         $qb = $this->createQueryBuilder('os');\n744: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

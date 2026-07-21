# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-04_0306_sheet-6_sheet.json#f06-04_0306_sheet-6_sheet-conformance-117b757b478f`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-04_0306_sheet-6_sheet.json`
- sourceFindingId: `f06-04_0306_sheet-6_sheet-conformance-117b757b478f`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-04_0306_sheet-6_sheet` / F06-04 パスワード再発行
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: パスワード更新（リセット完了）成功時に完了ログを保存する（会員ID・メールアドレス・アクセス元グローバルIP）。
- implementationActual: reset() の更新成功パス（password ハッシュ化→UPDATE→イベント dispatch→addFlash→redirect）に log_info/log_warning 等のログ出力が一切ない。再発行メール送信時は :103 で完了ログを出すが、更新完了時の対応ログは存在しない。
- mismatchReason: 設計はパスワード更新完了時に会員ID・メール・接続元IPを含む完了ログの保存を要求するが、実装の更新成功パスにはログ出力がなく完了ログのみ欠落している。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-6（パスワード再設定完了 機能仕様／ログ・監査節）
- implRef: src/Eccube/Controller/Front/ForgotController.php:186-215（更新成功パスに該当処理なし）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-04_0306_sheet-6_sheet-conformance-117b757b478f",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-6",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-6（パスワード再設定完了 機能仕様／ログ・監査節）",
  "designExpectation": "パスワード更新（リセット完了）成功時に完了ログを保存する（会員ID・メールアドレス・アクセス元グローバルIP）。",
  "designQuote": "パスワード更新（リセット完了）成功時に完了ログを保存する（会員ID・メールアドレス・アクセス元グローバルIP）。",
  "implRef": "src/Eccube/Controller/Front/ForgotController.php:186-215（更新成功パスに該当処理なし）",
  "implementationActual": "reset() の更新成功パス（password ハッシュ化→UPDATE→イベント dispatch→addFlash→redirect）に log_info/log_warning 等のログ出力が一切ない。再発行メール送信時は :103 で完了ログを出すが、更新完了時の対応ログは存在しない。",
  "difference": "設計はパスワード更新完了時に会員ID・メール・接続元IPを含む完了ログの保存を要求するが、実装の更新成功パスにはログ出力がなく完了ログのみ欠落している。",
  "mismatchReason": "設計はパスワード更新完了時に会員ID・メール・接続元IPを含む完了ログの保存を要求するが、実装の更新成功パスにはログ出力がなく完了ログのみ欠落している。",
  "comparisonRows": [
    {
      "item": "更新完了ログ",
      "design": "会員ID・メール・接続元IPを含む完了ログを保存",
      "implementation": "更新成功パスにログ出力なし",
      "mismatch": "完了ログ未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-04_0306_sheet-6_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/ForgotController.php:186-215（更新成功パスに該当処理なし）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「パスワード更新（リセット完了）成功時に完了ログを保存する（会員ID・メールアドレス・アクセス元グローバルIP）。」。実装は「reset() の更新成功パス（password ハッシュ化→UPDATE→イベント dispatch→addFlash→redirect）に log_info/log_warning 等のログ出力が一切ない。再発行メール送信時は :103 で完了ログを出すが、更新完了時の対応ログは存在しない。」。乖離理由は「設計はパスワード更新完了時に会員ID・メール・接続元IPを含む完了ログの保存を要求するが、実装の更新成功パスにはログ出力がなく完了ログのみ欠落している。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Repository・Entity・DB",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2132\n2129:       </section>\n2130:       <!-- function-design-embed:end f06-03-f06-03_front_member_customer_login -->\n2131: </section>\n2132:       <section class=\"sheet-panel\" id=\"sheet-6\">\n2133:         <div class=\"sheet-heading\">\n2134:           <h2>パスワード再発行</h2>\n2135:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/ForgotController.php:186-215",
    "src/Eccube/Controller/Front/ForgotController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/ForgotController.php:186\n183:         $form->handleRequest($request);\n184:         $error = null;\n185: \n186:         if ($form->isSubmitted() && $form->isValid()) {\n187:             // リセットキー・入力メールアドレスで会員情報検索\n188:             $Customer = $this->registerCustomerViewRepository\n189:                 ->getRegularCustomerByResetKey($reset_key, $form->get('login_email')->getData());",
    "src/Eccube/Controller/Front/ForgotController.php:33\n30: use Symfony\\Component\\Validator\\Constraints as Assert;\n31: use Symfony\\Component\\Validator\\Validator\\ValidatorInterface;\n32: \n33: class ForgotController extends AbstractController\n34: {\n35:     /**\n36:      * ForgotController constructor."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

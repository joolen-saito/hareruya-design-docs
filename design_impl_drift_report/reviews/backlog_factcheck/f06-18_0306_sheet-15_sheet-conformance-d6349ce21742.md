# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json#f06-18_0306_sheet-15_sheet-conformance-d6349ce21742`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-18_0306_sheet-15_sheet.json`
- sourceFindingId: `f06-18_0306_sheet-15_sheet-conformance-d6349ce21742`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-18_0306_sheet-15_sheet` / F06-18 会員情報変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: ブラックリスト該当値へ変更して変更するを押下すると専用の会員情報更新エラー画面へ遷移する。かつ本機能はフラッシュ・トーストを生成しない。
- implementationActual: ブラックリスト該当時 addFlash('error','front.mypage.change.error.blacklisted') を積み同一 change.twig(mypage_change) を再描画するのみ。専用の会員情報更新エラー画面へのルート/テンプレート(change_error/customer_update_error 相当)は不在。
- mismatchReason: 設計は専用エラー画面への遷移かつフラッシュ非生成を規定するが、実装は画面遷移せずフラッシュ付き再描画する。ChangeController・change.twig・default_frame.twig を確認し会員情報変更用エラー画面は不在。遷移仕様とフラッシュ非生成方針の双方に反する。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15 (カスタマイズ説明『ブラックリストに…変更するを押下すると、会員情報更新エラー画面に遷移する』／業務ルール『本機能はフラッシュ・トーストを生成しない』)
- implRef: src/Eccube/Controller/Front/Mypage/ChangeController.php:116-133

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-18_0306_sheet-15_sheet-conformance-d6349ce21742",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-15 (カスタマイズ説明『ブラックリストに…変更するを押下すると、会員情報更新エラー画面に遷移する』／業務ルール『本機能はフラッシュ・トーストを生成しない』)",
  "designExpectation": "ブラックリスト該当値へ変更して変更するを押下すると専用の会員情報更新エラー画面へ遷移する。かつ本機能はフラッシュ・トーストを生成しない。",
  "designQuote": "ブラックリスト該当値へ変更して変更するを押下すると専用の会員情報更新エラー画面へ遷移する。かつ本機能はフラッシュ・トーストを生成しない。",
  "implRef": "src/Eccube/Controller/Front/Mypage/ChangeController.php:116-133",
  "implementationActual": "ブラックリスト該当時 addFlash('error','front.mypage.change.error.blacklisted') を積み同一 change.twig(mypage_change) を再描画するのみ。専用の会員情報更新エラー画面へのルート/テンプレート(change_error/customer_update_error 相当)は不在。",
  "difference": "設計は専用エラー画面への遷移かつフラッシュ非生成を規定するが、実装は画面遷移せずフラッシュ付き再描画する。ChangeController・change.twig・default_frame.twig を確認し会員情報変更用エラー画面は不在。遷移仕様とフラッシュ非生成方針の双方に反する。",
  "mismatchReason": "設計は専用エラー画面への遷移かつフラッシュ非生成を規定するが、実装は画面遷移せずフラッシュ付き再描画する。ChangeController・change.twig・default_frame.twig を確認し会員情報変更用エラー画面は不在。遷移仕様とフラッシュ非生成方針の双方に反する。",
  "comparisonRows": [
    {
      "item": "ブラックリスト該当時の遷移",
      "design": "会員情報更新エラー画面へ遷移",
      "implementation": "同一編集画面を再描画",
      "mismatch": "専用エラー画面へ遷移しない"
    },
    {
      "item": "エラー通知方式",
      "design": "フラッシュ・トーストを生成しない",
      "implementation": "addFlash('error',...) を生成",
      "mismatch": "フラッシュを生成している"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-18_0306_sheet-15_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/Mypage/ChangeController.php:116-133",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「ブラックリスト該当値へ変更して変更するを押下すると専用の会員情報更新エラー画面へ遷移する。かつ本機能はフラッシュ・トーストを生成しない。」。実装は「ブラックリスト該当時 addFlash('error','front.mypage.change.error.blacklisted') を積み同一 change.twig(mypage_change) を再描画するのみ。専用の会員情報更新エラー画面へのルート/テンプレート(change_error/customer_update_error 相当)は不在。」。乖離理由は「設計は専用エラー画面への遷移かつフラッシュ非生成を規定するが、実装は画面遷移せずフラッシュ付き再描画する。ChangeController・change.twig・default_frame.twig を確認し会員情報変更用エラー画面は不在。遷移仕様とフラッシュ非生成方針の双方に反する。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:4925\n4922:       </section>\n4923:       <!-- function-design-embed:end f06-17-f06-17_front_member_mypage_event_deck_complete -->\n4924: </section>\n4925:       <section class=\"sheet-panel\" id=\"sheet-15\">\n4926:         <div class=\"sheet-heading\">\n4927:           <h2>会員情報変更</h2>\n4928:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Mypage/ChangeController.php:116-133",
    "src/Eccube/Controller/Front/Mypage/ChangeController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Mypage/ChangeController.php:116\n113:                     : ($Customer->getPostalCode() !== $LoginCustomer->getPostalCode());\n114: \n115:                 $isAddressChanged = ($Customer->getCountry() !== $LoginCustomer->getCountry())\n116:                     || $isZipChanged\n117:                     || ($Customer->getPref()?->getId() !== $LoginCustomer->getPref()?->getId())\n118:                     || ($Customer->getAddr01() !== $LoginCustomer->getAddr01())\n119:                     || ($Customer->getAddr02() !== $LoginCustomer->getAddr02());",
    "src/Eccube/Controller/Front/Mypage/ChangeController.php:40\n37: use Twig\\Error\\RuntimeError;\n38: use Twig\\Error\\SyntaxError;\n39: \n40: class ChangeController extends AbstractController\n41: {\n42:     private const string SESSION_KEY_PRE_EMAIL = 'eccube.front.mypage.change.preEmail';\n43: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

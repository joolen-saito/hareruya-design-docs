# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-07_0304_sheet-9_sheet.json#f06-07_0304_sheet-9_sheet-conformance-201244ef1a45`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-07_0304_sheet-9_sheet.json`
- sourceFindingId: `f06-07_0304_sheet-9_sheet-conformance-201244ef1a45`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-07_0304_sheet-9_sheet` / F06-07 注文購入履歴詳細
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 獲得ポイントには「※獲得ポイントは商品出荷時に有効になります。」の注記を詳細画面表示時に常時表示する。
- implementationActual: 購入履歴詳細テンプレートに注記文言が一切出力されていない。獲得ポイントは shopping_history_detail.twig:225-226 で表示されるが注記なし。翻訳キー front.shopping.notice.point（messages.ja.yaml:1417 / messages.en.yaml:1194）は購入確認画面 Shopping/index.twig:756 でのみ使用され本画面で未参照。Controller にも注記生成なし。
- mismatchReason: shopping_history_detail.twig を grep しても注記文言・front.shopping.notice.point の出力がなく、locale に文言は存在するが detail 画面テンプレートで参照していない。Controller 側にもメッセージ生成がないため、設計が常時表示と規定する注記が画面に出ない（未実装確定）。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-9（表示メッセージ 常時表示：ポイント注記＝※獲得ポイントは商品出荷時に有効になります。 条件＝詳細画面の表示時）
- implRef: 不在（src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig 全域、Controller Front/Mypage/MypageController::shoppingHistoryDetail 478-508行）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-07_0304_sheet-9_sheet-conformance-201244ef1a45",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-9",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-9（表示メッセージ 常時表示：ポイント注記＝※獲得ポイントは商品出荷時に有効になります。 条件＝詳細画面の表示時）",
  "designExpectation": "獲得ポイントには「※獲得ポイントは商品出荷時に有効になります。」の注記を詳細画面表示時に常時表示する。",
  "designQuote": "獲得ポイントには「※獲得ポイントは商品出荷時に有効になります。」の注記を詳細画面表示時に常時表示する。",
  "implRef": "不在（src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig 全域、Controller Front/Mypage/MypageController::shoppingHistoryDetail 478-508行）",
  "implementationActual": "購入履歴詳細テンプレートに注記文言が一切出力されていない。獲得ポイントは shopping_history_detail.twig:225-226 で表示されるが注記なし。翻訳キー front.shopping.notice.point（messages.ja.yaml:1417 / messages.en.yaml:1194）は購入確認画面 Shopping/index.twig:756 でのみ使用され本画面で未参照。Controller にも注記生成なし。",
  "difference": "shopping_history_detail.twig を grep しても注記文言・front.shopping.notice.point の出力がなく、locale に文言は存在するが detail 画面テンプレートで参照していない。Controller 側にもメッセージ生成がないため、設計が常時表示と規定する注記が画面に出ない（未実装確定）。",
  "mismatchReason": "shopping_history_detail.twig を grep しても注記文言・front.shopping.notice.point の出力がなく、locale に文言は存在するが detail 画面テンプレートで参照していない。Controller 側にもメッセージ生成がないため、設計が常時表示と規定する注記が画面に出ない（未実装確定）。",
  "comparisonRows": [
    {
      "item": "獲得ポイント注記の表示",
      "design": "※獲得ポイントは商品出荷時に有効になります。 を詳細画面表示時に常時表示",
      "implementation": "注記出力なし（gained_points のみ表示、front.shopping.notice.point 未参照）",
      "mismatch": "注記が画面に表示されない（未実装）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-07_0304_sheet-9_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig 全域、Controller Front/Mypage/MypageController::shoppingHistoryDetail 478-508行）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「獲得ポイントには「※獲得ポイントは商品出荷時に有効になります。」の注記を詳細画面表示時に常時表示する。」。実装は「購入履歴詳細テンプレートに注記文言が一切出力されていない。獲得ポイントは shopping_history_detail.twig:225-226 で表示されるが注記なし。翻訳キー front.shopping.notice.point（messages.ja.yaml:1417 / messages.en.yaml:1194）は購入確認画面 Shopping/index.twig:756 でのみ使用され本画面で未参照。Controller にも注記生成なし。」。乖離理由は「shopping_history_detail.twig を grep しても注記文言・front.shopping.notice.point の出力がなく、locale に文言は存在するが detail 画面テンプレートで参照していない。Controller 側にもメッセージ生成がないため、設計が常時表示と規定する注記が画面に出ない（未実装確定）。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2850\n2847:       </section>\n2848:       <!-- function-design-embed:end f06-06-f06-06_front_member_mypage_order_history -->\n2849: </section>\n2850:       <section class=\"sheet-panel\" id=\"sheet-9\">\n2851:         <div class=\"sheet-heading\">\n2852:           <h2>注文購入履歴詳細</h2>\n2853:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/shopping_history_detail.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

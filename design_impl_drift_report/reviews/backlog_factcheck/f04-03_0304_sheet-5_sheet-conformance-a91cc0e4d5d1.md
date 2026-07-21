# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-a91cc0e4d5d1`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json`
- sourceFindingId: `f04-03_0304_sheet-5_sheet-conformance-a91cc0e4d5d1`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-03_0304_sheet-5_sheet` / F04-03 配送先の新規登録_変更
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 新規登録時、アドレス帳件数が登録上限（20）以上なら『お届け先登録数の上限を超えています。』(front.shopping.error.customer_address_max) の上限超過エラーをご注文方法指定画面のエラー領域へ表示し、ご注文方法指定へ戻す。
- implementationActual: shippingEdit() は会員配送先件数が eccube_deliv_addr_max 以上のとき throw new NotFoundHttpException(); で404を返すのみ。設計指定キー front.shopping.error.customer_address_max・文言はロケールに不在。別キー common.customer_address_count_is_over は文言・遷移とも異なる（ご注文方法指定側でのリンク抑止用途）。
- mismatchReason: ShoppingController.php:788-792 で404例外分岐を確認。messages.ja/en.yaml を grep し front.shopping.error.customer_address_max と当該文言が不在（common.customer_address_count_is_over のみ存在、文言・挙動が異なる）ことを確認。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5
- implRef: src/Eccube/Controller/Front/ShoppingController.php:788-792

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-03_0304_sheet-5_sheet-conformance-a91cc0e4d5d1",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-5",
  "designRefDetail": null,
  "designExpectation": "新規登録時、アドレス帳件数が登録上限（20）以上なら『お届け先登録数の上限を超えています。』(front.shopping.error.customer_address_max) の上限超過エラーをご注文方法指定画面のエラー領域へ表示し、ご注文方法指定へ戻す。",
  "designQuote": "新規登録時、アドレス帳件数が登録上限（20）以上なら『お届け先登録数の上限を超えています。』(front.shopping.error.customer_address_max) の上限超過エラーをご注文方法指定画面のエラー領域へ表示し、ご注文方法指定へ戻す。",
  "implRef": "src/Eccube/Controller/Front/ShoppingController.php:788-792",
  "implementationActual": "shippingEdit() は会員配送先件数が eccube_deliv_addr_max 以上のとき throw new NotFoundHttpException(); で404を返すのみ。設計指定キー front.shopping.error.customer_address_max・文言はロケールに不在。別キー common.customer_address_count_is_over は文言・遷移とも異なる（ご注文方法指定側でのリンク抑止用途）。",
  "difference": "ShoppingController.php:788-792 で404例外分岐を確認。messages.ja/en.yaml を grep し front.shopping.error.customer_address_max と当該文言が不在（common.customer_address_count_is_over のみ存在、文言・挙動が異なる）ことを確認。",
  "mismatchReason": "ShoppingController.php:788-792 で404例外分岐を確認。messages.ja/en.yaml を grep し front.shopping.error.customer_address_max と当該文言が不在（common.customer_address_count_is_over のみ存在、文言・挙動が異なる）ことを確認。",
  "comparisonRows": [
    {
      "item": "エラー時の挙動",
      "design": "上限超過エラー文言をご注文方法指定のエラー領域へ表示し戻す",
      "implementation": "NotFoundHttpException で404ページ",
      "mismatch": "文言表示・遷移が404に置換"
    },
    {
      "item": "メッセージキー",
      "design": "front.shopping.error.customer_address_max",
      "implementation": "キー自体が不在",
      "mismatch": "キー未定義"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-03_0304_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/ShoppingController.php:788-792",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「新規登録時、アドレス帳件数が登録上限（20）以上なら『お届け先登録数の上限を超えています。』(front.shopping.error.customer_address_max) の上限超過エラーをご注文方法指定画面のエラー領域へ表示し、ご注文方法指定へ戻す。」。実装は「shippingEdit() は会員配送先件数が eccube_deliv_addr_max 以上のとき throw new NotFoundHttpException(); で404を返すのみ。設計指定キー front.shopping.error.customer_address_max・文言はロケールに不在。別キー common.customer_address_count_is_over は文言・遷移とも異なる（ご注文方法指定側でのリンク抑止用途）。」。乖離理由は「ShoppingController.php:788-792 で404例外分岐を確認。messages.ja/en.yaml を grep し front.shopping.error.customer_address_max と当該文言が不在（common.customer_address_count_is_over のみ存在、文言・挙動が異なる）ことを確認。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1887\n1884:       </section>\n1885:       <!-- function-design-embed:end f04-02-f04-02_front_cart_shopping_order_method -->\n1886: </section>\n1887:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1888:         <div class=\"sheet-heading\">\n1889:           <h2>配送先の新規登録_変更</h2>\n1890:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/ShoppingController.php:788-792",
    "src/Eccube/Controller/Front/ShoppingController.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/ShoppingController.php:788\n785:         $preOrderId = $this->cartService->getPreOrderId();\n786:         $Order = $this->orderHelper->getPurchaseProcessingOrder($preOrderId);\n787:         if (!$Order) {\n788:             return $this->redirectToRoute('shopping_error');\n789:         }\n790: \n791:         // 受注に紐づくShippingかどうかのチェック.",
    "src/Eccube/Controller/Front/ShoppingController.php:92\n89:  * `checkout()` が同一リクエストで呼ばれる。`confirm.twig` の `action` は `shopping_checkout` のままなので、\n90:  * 確認画面を表示するカスタムやテストが `POST shopping_checkout` する経路は残る。ルート名と実際の HTTP の対応を混同しないこと。\n91:  */\n92: class ShoppingController extends AbstractShoppingController\n93: {\n94:     /**\n95:      * `confirm()` から内部呼び出しで {@see checkout()} に渡すフラグ。"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

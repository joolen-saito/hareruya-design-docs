# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-04_0304_sheet-7_sheet.json#f04-04-store-account-complete-1min-auto-redirect-missing-01`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-04_0304_sheet-7_sheet.json`
- sourceFindingId: `f04-04-store-account-complete-1min-auto-redirect-missing-01`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-04_0304_sheet-7_sheet` / F04-04 決済~購入完了
- issueCategory: 実装漏れ
- dimension: ②業務ルール・画面自動遷移未実装

## Finding Fields
- designExpectation: 店内アカウントの場合だけ、購入完了画面を表示してから1分後に、注文した店舗のTOP画面へ自動的に遷移する。
- implementationActual: ShoppingController::complete は受注ID取得、待ち番号取得、セッションクリア後に Order/hasNextCart/products/waitingNumber をテンプレートへ渡す。Shopping/complete.twig は waitingNumber があればTC注文番号相当の表示を切り替え、TOPページへ戻るボタンを href="{{ url('homepage') }}" で表示するが、app.user/Order.Custome…
- mismatchReason: 購入完了画面の Controller/Twig/関連JSを確認したが、設計が要求する店内アカウント限定の1分タイマーと注文店舗TOPへの強制遷移処理が確認できないため。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2452
- implRef: src/Eccube/Controller/Front/ShoppingController.php:615-670 / src/Eccube/Resource/template/default/Shopping/complete.twig:80-118 / html/template/default/assets/hareruya/js/hareruya-checkout.js

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-04-store-account-complete-1min-auto-redirect-missing-01",
  "dimension": "②業務ルール・画面自動遷移未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2452",
  "designQuote": "店内アカウントの場合、画面を表示してから1分後に注文した店舗のTOP画面へ自動的に遷移する",
  "implRef": "src/Eccube/Controller/Front/ShoppingController.php:615-670 / src/Eccube/Resource/template/default/Shopping/complete.twig:80-118 / html/template/default/assets/hareruya/js/hareruya-checkout.js",
  "difference": "設計は、店内アカウントの購入完了画面で表示開始から1分後に注文した店舗のTOPへユーザー操作なしで自動遷移することを要求している。実装は購入完了画面を表示し、店内注文番号（waitingNumber）と通常のTOPページへ戻るボタンを出すが、店内アカウント判定に基づく60秒タイマーと自動 location 遷移が確認できない。",
  "designExpectation": "店内アカウントの場合だけ、購入完了画面を表示してから1分後に、注文した店舗のTOP画面へ自動的に遷移する。",
  "implementationActual": "ShoppingController::complete は受注ID取得、待ち番号取得、セッションクリア後に Order/hasNextCart/products/waitingNumber をテンプレートへ渡す。Shopping/complete.twig は waitingNumber があればTC注文番号相当の表示を切り替え、TOPページへ戻るボタンを href=\"{{ url('homepage') }}\" で表示するが、app.user/Order.Customer の店内アカウント条件、setTimeout/setInterval/60000、注文店舗TOP URLへの自動遷移処理がない。",
  "comparisonRows": [
    {
      "item": "対象条件",
      "design": "店内アカウントの場合に限定して自動遷移する。",
      "implementation": "WaitingNumberProcessor には isOtcGroup 判定があり店内注文番号は発番されるが、ShoppingController::complete と Shopping/complete.twig では購入グループを判定して自動遷移の有無を切り替えていない。",
      "mismatch": "設計の店内アカウント条件が購入完了画面の自動遷移制御に使われていない。"
    },
    {
      "item": "タイマー",
      "design": "画面を表示してから1分後に遷移する。",
      "implementation": "complete.twig と関連 checkout JS に setTimeout/setInterval、60000、60 * 1000 などの1分タイマー処理がない。",
      "mismatch": "表示開始から1分を測るクライアント側またはサーバー側のタイマー処理が未実装。"
    },
    {
      "item": "遷移方法と遷移先",
      "design": "注文した店舗のTOP画面へ自動的に遷移する。項目表のTOPページへ戻るボタンも注文した店舗のTOP画面へ遷移する。",
      "implementation": "画面上には href=\"{{ url('homepage') }}\" の手動TOPボタンだけがあり、注文した店舗のTOP URLを算出して location.href/location.assign 等で自動遷移する処理はない。",
      "mismatch": "通常TOPへの手動リンクはあるが、注文店舗TOPへの自動遷移という設計要求を満たしていない。"
    }
  ],
  "comparisonSummary": "②業務ルール・画面自動遷移未実装：設計は「店内アカウントの場合だけ、購入完了画面を表示してから1分後に、注文した店舗のTOP画面へ自動的に遷移する。」。実装は「ShoppingController::complete は受注ID取得、待ち番号取得、セッションクリア後に Order/hasNextCart/products/waitingNumber をテンプレートへ渡す。Shopping/complete.twig は waitingNumber があればTC注文番号相当の表示を切り替え、TOPページへ戻るボタンを href=\"{{ url('homepage') }}\" で表示するが、app.user/Order.Customer の店内アカウント条件、setTime…」。乖離理由は「購入完了画面の Controller/Twig/関連JSを確認したが、設計が要求する店内アカウント限定の1分タイマーと注文店舗TOPへの強制遷移処理が確認できないため。」。",
  "mismatchReason": "購入完了画面の Controller/Twig/関連JSを確認したが、設計が要求する店内アカウント限定の1分タイマーと注文店舗TOPへの強制遷移処理が確認できないため。",
  "impact": "店内アカウントで購入完了画面が店舗端末に残り続ける可能性があり、設計上想定している店舗TOPへの自動復帰と次操作への復帰導線が実装挙動と一致しない。",
  "fixTarget": "src/Eccube/Controller/Front/ShoppingController.php、src/Eccube/Resource/template/default/Shopping/complete.twig、必要に応じて hareruya-checkout.js",
  "requiredChange": "購入完了画面へ店内アカウント判定結果と注文店舗TOP URLを渡し、該当時だけ 60000ms の setTimeout でそのURLへ自動遷移する。TOPページへ戻るボタンも設計どおり注文した店舗のTOPを向くようにする。",
  "implementationRefs": [
    "src/Eccube/Controller/Front/ShoppingController.php:615",
    "src/Eccube/Controller/Front/ShoppingController.php:645",
    "src/Eccube/Controller/Front/ShoppingController.php:665",
    "src/Eccube/Resource/template/default/Shopping/complete.twig:88",
    "src/Eccube/Resource/template/default/Shopping/complete.twig:100",
    "src/Eccube/Resource/template/default/Shopping/complete.twig:115",
    "src/Eccube/Entity/DtbCustomerGroup.php:34",
    "src/Eccube/Entity/DtbCustomerGroup.php:235",
    "src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php:44"
  ],
  "evidence": "設計HTML:2452 は店内アカウントの1分後自動遷移を定義し、:2464 はTOPボタンの遷移先を注文店舗TOPとする。ShoppingController.php:645 は店内注文番号を取得するが、:665-670 でテンプレートへ渡す値に店内アカウント判定や注文店舗TOP URLがない。complete.twig:88-102 は waitingNumber 表示だけを切り替え、:115 は通常の homepage リンクを表示するのみ。関連JS検索でも setTimeout/setInterval/60000 と自動 location 遷移は確認できない。",
  "requirementTrace": [
    {
      "requirementId": "f04-04-store-account-complete-1min-auto-redirect",
      "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2452",
      "designRequirement": "店内アカウントの場合、画面を表示してから1分後に注文した店舗のTOP画面へ自動的に遷移する。",
      "implementationSearchTerms": [
        "ShoppingController::complete",
        "Shopping/complete.twig",
        "waitingNumber",
        "DtbCustomerGroup::OTC / OTC_SHITEN / isOtcGroup",
        "setTimeout / setInterval / 60000 / 60 * 1000",
        "window.location / location.href / location.assign / location.replace",
        "url('homepage') / 注文した店舗のTOP"
      ],
      "implementationRefs": [
        "src/Eccube/Controller/Front/ShoppingController.php:615",
        "src/Eccube/Controller/Front/ShoppingController.php:645",
        "src/Eccube/Controller/Front/ShoppingController.php:665",
        "src/Eccube/Resource/template/default/Shopping/complete.twig:88",
        "src/Eccube/Resource/template/default/Shopping/complete.twig:100",
        "src/Eccube/Resource/template/default/Shopping/complete.twig:115",
        "src/Eccube/Entity/DtbCustomerGroup.php:34",
        "src/Eccube/Entity/DtbCustomerGroup.php:235",
        "src/Eccube/Service/PurchaseFlow/Processor/WaitingNumberProcessor.php:44"
      ],
      "implementationActual": "ShoppingController::complete は受注ID取得、待ち番号取得、セッションクリア後に Order/hasNextCart/products/waitingNumber をテンプレートへ渡す。Shopping/complete.twig は waitingNumber があればTC注文番号相当の表示を切り替え、TOPページへ戻るボタンを href=\"{{ url('homepage') }}\" で表示するが、app.user/Order.Customer の店内アカウント条件、setTimeout/setInterval/60000、注文店舗TOP URLへの自動遷移処理がない。",
      "traceVerdict": "NOT_FOUND",
      "traceReason": "購入完了画面の Controller/Twig/関連JSを確認したが、設計が要求する店内アカウント限定の1分タイマーと注文店舗TOPへの強制遷移処理が確認できないため。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "explicit_requirement_trace_gate",
  "functionId": "f04-04_0304_sheet-7_sheet",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Service・業務ルール",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2452\n2449:             <div class=\"doc-bullet\" style=\"--lv:1\"><span class=\"doc-marker\">・</span><span>ご注文番号表示下にある文言も変更</span></div>\n2450:             <div class=\"doc-bullet\" style=\"--lv:0\"><span class=\"doc-marker\">★</span><span>フリースペースの追加</span></div>\n2451:             <div class=\"doc-bullet\" style=\"--lv:1\"><span class=\"doc-marker\">・</span><span>管理画面&gt;コンテンツ管理&gt;ブロック管理から文章の設定ができるようにする</span></div>\n2452:             <div class=\"doc-bullet\" style=\"--lv:0\"><span class=\"doc-marker\">★</span><span>店内アカウントの場合、画面を表示してから1分後に注文した店舗のTOP画面へ自動的に遷移する</span></div>\n2453:           </div>\n2454:           <div class=\"item-table-wrap\">\n2455:             <table class=\"item-table\">",
  "implementationSnippets": [
    "src/Eccube/Controller/Front/ShoppingController.php:615\n612:             $this->uniSearchService->sendCompleteTaglog($taglogProducts);\n613: \n614:             log_info('[注文処理] 注文処理が完了しました. 購入完了画面へ遷移します.', [$Order->getId()]);\n615: \n616:             return $this->redirectToRoute('shopping_complete');\n617:         }\n618: ",
    "src/Eccube/Controller/Front/ShoppingController.php:645\n642:         }\n643: \n644:         $Order = $this->orderRepository->find($orderId);\n645: \n646:         $event = new EventArgs(\n647:             [\n648:                 'Order' => $Order,",
    "src/Eccube/Controller/Front/ShoppingController.php:665\n662:         foreach ($Order->getProductOrderItems() as $OrderItem) {\n663:             $products[] = [\n664:                 'sku' => $OrderItem->getProductCode() ?? '',\n665:                 'name' => $OrderItem->getProductName(),\n666:                 'category' => '',\n667:                 'price' => $OrderItem->getPrice(),\n668:                 'quantity' => $OrderItem->getQuantity(),"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

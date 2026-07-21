# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json#f04-02-order-submit-30min-timeout-missing-01`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json`
- sourceFindingId: `f04-02-order-submit-30min-timeout-missing-01`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-02_0304_sheet-4_sheet` / F04-02 ご注文方法指定
- issueCategory: 実装漏れ
- dimension: ②業務ルール・タイムアウト未実装

## Finding Fields
- designExpectation: 注文するボタン押下時、注文方法指定画面表示後（受注データ作成後）30分を経過していれば、タイムアウトとしてカート画面へ遷移し、カート内の商品は保持する。
- implementationActual: ShoppingController::confirm と ShoppingController::checkout は cart/preOrderId/処理中受注の存在確認後に注文検証・決済検証・注文確定へ進むが、Order::getCreateDate などで受注作成日時を参照して30分経過を判定する処理がない。OrderHelper::getPurchaseProcessingOrder と initializeOrder も pre_order_id と PROCE…
- mismatchReason: 注文確定POST経路である ShoppingController::confirm / checkout と、処理中受注を返す OrderHelper に、設計が要求する30分経過判定・カート画面へのタイムアウト遷移・カート保持処理が確認できないため。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1663-1664
- implRef: src/Eccube/Controller/Front/ShoppingController.php:289-380 / src/Eccube/Controller/Front/ShoppingController.php:405-615 / src/Eccube/Service/OrderHelper.php:242-313

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-02-order-submit-30min-timeout-missing-01",
  "dimension": "②業務ルール・タイムアウト未実装",
  "severity": "high",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1663-1664",
  "designQuote": "注文するボタン押下時、当画面表示後（受注データ作成後）30分を経過している場合はタイムアウトとしてカート画面へ遷移する。カート内の商品は保持する。",
  "implRef": "src/Eccube/Controller/Front/ShoppingController.php:289-380 / src/Eccube/Controller/Front/ShoppingController.php:405-615 / src/Eccube/Service/OrderHelper.php:242-313",
  "difference": "設計は、受注データ作成後30分を超えて注文するボタンを押下した場合にタイムアウト扱いとしてカート画面へ戻し、カート商品は保持することを要求している。実装の shopping_confirm / shopping_checkout / OrderHelper では処理中受注の作成日時と現在時刻を比較する30分超過判定、およびその場合に cart へ戻す分岐が確認できない。",
  "designExpectation": "注文するボタン押下時、注文方法指定画面表示後（受注データ作成後）30分を経過していれば、タイムアウトとしてカート画面へ遷移し、カート内の商品は保持する。",
  "implementationActual": "ShoppingController::confirm と ShoppingController::checkout は cart/preOrderId/処理中受注の存在確認後に注文検証・決済検証・注文確定へ進むが、Order::getCreateDate などで受注作成日時を参照して30分経過を判定する処理がない。OrderHelper::getPurchaseProcessingOrder と initializeOrder も pre_order_id と PROCESSING ステータスで処理中受注を取得・再利用するだけで、有効期限判定を行わない。",
  "comparisonRows": [
    {
      "item": "30分超過判定",
      "design": "受注データ作成後30分を経過している場合はタイムアウトと判定する。",
      "implementation": "shopping_confirm / shopping_checkout では処理中受注を取得するが、受注作成日時と現在時刻の差分、1800秒、30 minutes 等による判定がない。",
      "mismatch": "設計の時間条件を評価する業務ロジックが未実装。"
    },
    {
      "item": "タイムアウト時の遷移先",
      "design": "30分超過時はカート画面へ遷移する。",
      "implementation": "cart へ戻る分岐はカート空・preOrderId 不在などの異常時であり、30分超過を理由に redirectToRoute('cart') する分岐はない。",
      "mismatch": "設計が要求するタイムアウト専用の状態遷移が存在しない。"
    },
    {
      "item": "カート商品の保持",
      "design": "タイムアウト時もカート内の商品は保持する。",
      "implementation": "タイムアウト分岐自体がないため、pre_order_id/注文途中状態だけをリセットしカート商品を保持する処理も確認できない。cartService->clear() は注文完了後の成功パスで実行される。",
      "mismatch": "30分超過時にどの状態だけを破棄し、カート商品を保持するかが実装されていない。"
    }
  ],
  "comparisonSummary": "②業務ルール・タイムアウト未実装：設計は「注文するボタン押下時、注文方法指定画面表示後（受注データ作成後）30分を経過していれば、タイムアウトとしてカート画面へ遷移し、カート内の商品は保持する。」。実装は「ShoppingController::confirm と ShoppingController::checkout は cart/preOrderId/処理中受注の存在確認後に注文検証・決済検証・注文確定へ進むが、Order::getCreateDate などで受注作成日時を参照して30分経過を判定する処理がない。OrderHelper::getPurchaseProcessingOrder と initializeOrder も pre_order_id と PROCESSING ステータスで処理中受注を取得…」。乖離理由は「注文確定POST経路である ShoppingController::confirm / checkout と、処理中受注を返す OrderHelper に、設計が要求する30分経過判定・カート画面へのタイムアウト遷移・カート保持処理が確認できないため。」。",
  "mismatchReason": "注文確定POST経路である ShoppingController::confirm / checkout と、処理中受注を返す OrderHelper に、設計が要求する30分経過判定・カート画面へのタイムアウト遷移・カート保持処理が確認できないため。",
  "impact": "注文方法指定画面を表示してから30分を超えても注文確定処理へ進める可能性があり、設計上タイムアウトさせるべき古い処理中受注、配送・支払条件、金額検証の扱いが実装挙動と一致しない。",
  "fixTarget": "src/Eccube/Controller/Front/ShoppingController.php の shopping_confirm / shopping_checkout、または共通の注文タイムアウト判定ヘルパー",
  "requiredChange": "処理中受注取得後、$Order->getCreateDate() 等を基準に30分超過を判定し、超過時はカート商品を消さずに注文途中状態または pre_order_id を適切にリセットして cart へリダイレクトする。shopping_confirm と direct POST の shopping_checkout の両経路で同じ判定を通す。",
  "implementationRefs": [
    "src/Eccube/Controller/Front/ShoppingController.php:289",
    "src/Eccube/Controller/Front/ShoppingController.php:310",
    "src/Eccube/Controller/Front/ShoppingController.php:405",
    "src/Eccube/Controller/Front/ShoppingController.php:426",
    "src/Eccube/Service/OrderHelper.php:242",
    "src/Eccube/Service/OrderHelper.php:289",
    "src/Eccube/Service/OrderHelper.php:316"
  ],
  "evidence": "設計HTML:1663-1664 は30分経過時のカート遷移とカート保持を定義。ShoppingController.php:310 と :426 は処理中受注を取得するが作成日時の期限判定がなく、OrderHelper.php:242 は pre_order_id と PROCESSING ステータスで取得するのみ。OrderHelper.php:289 は既存処理中受注を再利用し、:316 の resetShoppingState は30分超過判定から呼ばれていない。",
  "requirementTrace": [
    {
      "requirementId": "f04-02-order-submit-30min-timeout",
      "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1663-1664",
      "designRequirement": "注文するボタン押下時、当画面表示後（受注データ作成後）30分を経過している場合はタイムアウトとしてカート画面へ遷移し、カート内の商品は保持する。",
      "implementationSearchTerms": [
        "ShoppingController::confirm",
        "ShoppingController::checkout",
        "OrderHelper::getPurchaseProcessingOrder",
        "OrderHelper::initializeOrder",
        "CartService::getPreOrderId",
        "Order::getCreateDate",
        "redirectToRoute('cart')",
        "modify('-30 minutes') / 1800 / interval"
      ],
      "implementationRefs": [
        "src/Eccube/Controller/Front/ShoppingController.php:289",
        "src/Eccube/Controller/Front/ShoppingController.php:310",
        "src/Eccube/Controller/Front/ShoppingController.php:405",
        "src/Eccube/Controller/Front/ShoppingController.php:426",
        "src/Eccube/Service/OrderHelper.php:242",
        "src/Eccube/Service/OrderHelper.php:289",
        "src/Eccube/Service/OrderHelper.php:316"
      ],
      "implementationActual": "ShoppingController::confirm と ShoppingController::checkout は cart/preOrderId/処理中受注の存在確認後に注文検証・決済検証・注文確定へ進むが、Order::getCreateDate などで受注作成日時を参照して30分経過を判定する処理がない。OrderHelper::getPurchaseProcessingOrder と initializeOrder も pre_order_id と PROCESSING ステータスで処理中受注を取得・再利用するだけで、有効期限判定を行わない。",
      "traceVerdict": "NOT_FOUND",
      "traceReason": "注文確定POST経路である ShoppingController::confirm / checkout と、処理中受注を返す OrderHelper に、設計が要求する30分経過判定・カート画面へのタイムアウト遷移・カート保持処理が確認できないため。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "explicit_requirement_trace_gate",
  "functionId": "f04-02_0304_sheet-4_sheet",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Service・業務ルール",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1663\n1660:           <div class=\"doc-flow\">\n1661:             <div class=\"doc-bullet\" style=\"--lv:0\"><span class=\"doc-marker\">★</span><span>表示について</span></div>\n1662:             <div class=\"doc-bullet\" style=\"--lv:1\"><span class=\"doc-marker\">・</span><span>支店の場合は「注文金額合計（税込）」のみを表示する</span></div>\n1663:             <div class=\"doc-bullet\" style=\"--lv:0\"><span class=\"doc-marker\">・</span><span>注文するボタン押下時、当画面表示後（受注データ作成後）30分を経過している場合はタイムアウトとしてカート画面へ遷移する</span></div>\n1664:             <div class=\"doc-bullet\" style=\"--lv:1\"><span class=\"doc-marker\">・</span><span>カート内の商品は保持する</span></div>\n1665:           </div>\n1666:           <div class=\"item-table-wrap\">",
  "implementationSnippets": [
    "src/Eccube/Controller/Front/ShoppingController.php:289\n286:         ];\n287:     }\n288: \n289:     /**\n290:      * 注文手続きフォームの送信先（POST `/shopping/confirm`）.\n291:      *\n292:      * フォームが有効な場合: 集計 → `shopping_confirm_*` レート制限 → `PaymentMethod::verify`。",
    "src/Eccube/Controller/Front/ShoppingController.php:310\n307: \n308:             return $this->redirectToRoute('shopping_login');\n309:         }\n310: \n311:         // カートチェック.\n312:         $Cart = $this->cartService->getCart();\n313:         if (!($Cart && $this->orderHelper->verifyCart($Cart))) {",
    "src/Eccube/Controller/Front/ShoppingController.php:405\n402:             'form' => $form->createView(),\n403:             'Order' => $Order,\n404:             'activeTradeLaws' => $activeTradeLaws,\n405:             'isMainShop' => $this->isMainShop(),\n406:             'CustomerAddressList' => $this->getCustomerAddressList($Order->getCustomer()),\n407:         ];\n408:     }"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json#f04-02-0304-sheet-4-sheet-b88ee5d2eb-01`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json`
- sourceFindingId: `f04-02-0304-sheet-4-sheet-b88ee5d2eb-01`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-02_0304_sheet-4_sheet` / F04-02 ご注文方法指定
- issueCategory: 実装漏れ
- dimension: ⑤画面表示・条件分岐

## Finding Fields
- designExpectation: 店頭受取・スムーズ店頭受取の注文方法指定画面では、備考欄を消して、お問合せフォームへの誘導エリアを表示する。通常配送では備考欄を表示し、問い合わせ誘導は非表示にする。
- implementationActual: Shopping/index.twig は delivery.id が Delivery::OTC_GROUP かどうかを isDeliveryOTC に設定し、同日受取チェックと「店頭受取」「スムーズ店頭受取」についての注意文だけを条件表示する。一方、備考欄 section は isDeliveryOTC で囲われておらず、front.shopping.message_info の「備考欄」ラベルと message textarea を常に描画する。読み込み JS は備考…
- mismatchReason: 実装は isDeliveryOTC を判定しているものの、その判定を備考欄 section の表示可否と contact ルート誘導エリアの表示に使っていないため、設計の条件付き画面切替を満たさない。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253-1258,1702
- implRef: src/Eccube/Resource/template/default/Shopping/index.twig:128,374-385,557-678 / html/template/default/assets/hareruya/js/hareruya-checkout.js:1 / src/Eccube/Resource/locale/messages.ja.yaml:1412-1415,1484-1485

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "functionId": "f04-02_0304_sheet-4_sheet",
  "dimension": "⑤画面表示・条件分岐",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253-1258,1702",
  "designQuote": "店頭受取、スムーズ店頭受取の場合、画面の表示切り替えをする。備考欄を非表示とする。お問合せフォームはこちらエリアを表示する。図形テキストにも「配送方法を『店頭受取』『スムーズ店頭受取』に切り替えた場合は備考欄を消し、問い合わせフォームへの誘導とする」とある。",
  "implRef": "src/Eccube/Resource/template/default/Shopping/index.twig:128,374-385,557-678 / html/template/default/assets/hareruya/js/hareruya-checkout.js:1 / src/Eccube/Resource/locale/messages.ja.yaml:1412-1415,1484-1485",
  "difference": "設計は店頭受取・スムーズ店頭受取では備考欄を非表示にし、代わりに「お問合せフォームはこちら」エリアを表示する要求。実装は isDeliveryOTC の判定を持つが、備考欄セクションと message テキストエリアは店頭受取でも常に描画され、問い合わせフォームへのリンクエリアも Shopping/index.twig 内に存在しない。",
  "designExpectation": "店頭受取・スムーズ店頭受取の注文方法指定画面では、備考欄を消して、お問合せフォームへの誘導エリアを表示する。通常配送では備考欄を表示し、問い合わせ誘導は非表示にする。",
  "implementationActual": "Shopping/index.twig は delivery.id が Delivery::OTC_GROUP かどうかを isDeliveryOTC に設定し、同日受取チェックと「店頭受取」「スムーズ店頭受取」についての注意文だけを条件表示する。一方、備考欄 section は isDeliveryOTC で囲われておらず、front.shopping.message_info の「備考欄」ラベルと message textarea を常に描画する。読み込み JS は備考欄の配置をレスポンシブに移動するだけで、店頭受取時に非表示化しない。Shopping/index.twig には contact ルートへのリンクまたは「お問合せフォームはこちら」エリアがない。",
  "comparisonRows": [
    {
      "item": "店頭受取時の備考欄",
      "design": "店頭受取、スムーズ店頭受取の場合は「備考欄を非表示とする」。",
      "implementation": "備考欄 section と message textarea は isDeliveryOTC 条件の外で常に描画される。isDeliveryOTC で分岐しているのは一部説明文と店頭受取注意文のみ。",
      "mismatch": "店頭受取時に備考欄を消す条件分岐が実装されていない。"
    },
    {
      "item": "店頭受取時の問い合わせ誘導",
      "design": "店頭受取、スムーズ店頭受取の場合は「お問合せフォームはこちらエリアを表示する」。",
      "implementation": "Shopping/index.twig と関連翻訳キーには contact ルートへのリンク、または「お問合せフォームはこちら」に相当する注文方法指定画面内エリアがない。",
      "mismatch": "備考欄の代替として表示すべき問い合わせフォーム誘導エリアが未実装。"
    },
    {
      "item": "通常配送時の逆条件",
      "design": "店頭受取、スムーズ店頭受取以外の場合は備考欄を表示し、お問合せフォームはこちらを非表示とする。",
      "implementation": "備考欄は通常配送でも店頭受取でも表示され、問い合わせ誘導エリアはどちらにも表示されない。",
      "mismatch": "配送方法による表示切替が設計どおりの二分岐になっていない。"
    }
  ],
  "comparisonSummary": "⑤画面表示・条件分岐：設計は「店頭受取・スムーズ店頭受取の注文方法指定画面では、備考欄を消して、お問合せフォームへの誘導エリアを表示する。通常配送では備考欄を表示し、問い合わせ誘導は非表示にする。」。実装は「Shopping/index.twig は delivery.id が Delivery::OTC_GROUP かどうかを isDeliveryOTC に設定し、同日受取チェックと「店頭受取」「スムーズ店頭受取」についての注意文だけを条件表示する。一方、備考欄 section は isDeliveryOTC で囲われておらず、front.shopping.message_info の「備考欄」ラベルと message textarea を常に描画する。読み込み JS は備考欄の配置をレスポンシブに移動するだけで、…」。乖離理由は「実装は isDeliveryOTC を判定しているものの、その判定を備考欄 section の表示可否と contact ルート誘導エリアの表示に使っていないため、設計の条件付き画面切替を満たさない。」。",
  "mismatchReason": "実装は isDeliveryOTC を判定しているものの、その判定を備考欄 section の表示可否と contact ルート誘導エリアの表示に使っていないため、設計の条件付き画面切替を満たさない。",
  "impact": "店頭受取・スムーズ店頭受取の利用者に、設計で意図した問い合わせフォーム誘導が出ず、代わりに設計上非表示の備考欄入力が残る。問い合わせ導線と注文時入力導線が設計と異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Shopping/index.twig / src/Eccube/Resource/locale/messages.ja.yaml / 必要に応じて hareruya-checkout.js",
  "requiredChange": "isDeliveryOTC が true の場合は備考欄 section または message textarea を非表示にし、contact ルートへの「お問合せフォームはこちら」誘導エリアを表示する。isDeliveryOTC が false の場合は現行どおり備考欄を表示し、問い合わせ誘導を出さない。",
  "requirementTrace": [
    {
      "requirementId": "f04-02-otc-contact-link-area",
      "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253-1258",
      "designRequirement": "店頭受取、スムーズ店頭受取の場合、備考欄を非表示にし、お問合せフォームはこちらエリアを表示する。",
      "implementationSearchTerms": [
        "isDeliveryOTC",
        "data-js-shipping-remarks",
        "front.shopping.message_info",
        "path('contact')",
        "url('contact')",
        "お問合せフォームはこちら"
      ],
      "implementationRefs": [
        "src/Eccube/Resource/template/default/Shopping/index.twig:128",
        "src/Eccube/Resource/template/default/Shopping/index.twig:374-385",
        "src/Eccube/Resource/template/default/Shopping/index.twig:557-678",
        "html/template/default/assets/hareruya/js/hareruya-checkout.js:1"
      ],
      "implementationActual": "店頭受取判定と注意文表示はあるが、備考欄は常時描画され、問い合わせフォーム誘導エリアは未検出。",
      "traceVerdict": "DRIFT",
      "traceReason": "設計が要求する二つの表示切替のうち、備考欄非表示と問い合わせ誘導表示が実装されていない。"
    }
  ],
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Shopping/index.twig:128",
    "src/Eccube/Resource/template/default/Shopping/index.twig:374-385",
    "src/Eccube/Resource/template/default/Shopping/index.twig:557-678",
    "html/template/default/assets/hareruya/js/hareruya-checkout.js:1",
    "src/Eccube/Resource/locale/messages.ja.yaml:1412-1415",
    "src/Eccube/Resource/locale/messages.ja.yaml:1484-1485"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Shopping/index.twig:128\n125:                                 <section class=\"p-hareruya-shipping__section p-hareruya-shipping__address-selector\">\n126:                                     <div class=\"p-hareruya-shipping__row\">\n127:                                         <div class=\"p-hareruya-shipping__heading-wrap\">\n128:                                             <h2 class=\"c-hareruya-heading--lev3\">{{ 'front.shopping.delivery_info'|trans }}</h2>\n129:                                         </div>\n130:                                         <div class=\"p-hareruya-shipping__content\">\n131:                                             {% if CustomerAddressList | length > 0 %}",
    "src/Eccube/Resource/template/default/Shopping/index.twig:374\n371:                                                     </ul>\n372:                                                     <p class=\"c-hareruya-text\">{{ 'front.shopping.payment_modal.credit.notes'|trans|raw }}</p>\n373:                                                     <p class=\"c-hareruya-text u-hareruya-mt20\">{{ 'front.shopping.payment_modal.cod.title'|trans|raw }}</p>\n374:                                                     <ul>\n375:                                                         <li>{{ 'front.shopping.payment_modal.cod.fee1'|trans }}</li>\n376:                                                         <li>{{ 'front.shopping.payment_modal.cod.fee2'|trans }}</li>\n377:                                                         <li>{{ 'front.shopping.payment_modal.cod.fee3'|trans }}</li>",
    "src/Eccube/Resource/template/default/Shopping/index.twig:557\n554:                                                                     </li>\n555:                                                                     <li class=\"p-hareruya-modal__ordered-list-item u-hareruya-mt20\">{{ 'front.shopping.reserve_return_modal.return.nonconformity.title'|trans }}\n556:                                                                         <dl class=\"u-hareruya-mt10\">\n557:                                                                             <dt>{{ 'front.shopping.reserve_return_modal.return.nonconformity.policy.title'|trans }}</dt>\n558:                                                                             <dd>\n559:                                                                                 <p class=\"c-hareruya-text\">{{ 'front.shopping.reserve_return_modal.return.nonconformity.policy.body'|trans }}</p>\n560:                                                                             </dd>"
  ],
  "evidence": "設計HTML:1253-1258 は店頭受取系で備考欄非表示・お問合せフォームエリア表示、通常配送で逆条件を定義。設計HTML:1702 も問い合わせフォームへの誘導を明記。Shopping/index.twig:128 は isDeliveryOTC を設定し、:374-385 は店頭受取注意文を表示するが、:557-678 の備考欄 section は isDeliveryOTC 条件外。hareruya-checkout.js:1 の data-js-shipping-remarks 処理はレスポンシブ配置移動のみ。Shopping/index.twig 内に contact ルートリンクや「お問合せフォームはこちら」エリアは見つからない。",
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "reaudit_harness",
  "id": "f04-02-0304-sheet-4-sheet-b88ee5d2eb-01",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "ルート・Controller",
    "Form・入力項目",
    "Service・業務ルール",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1253\n1250:             <div class=\"doc-bullet\" style=\"--lv:2\"><span class=\"doc-marker\">・</span><span>コンビニ決済の場合、コンビニ決済へに変更する</span></div>\n1251:             <div class=\"doc-bullet\" style=\"--lv:2\"><span class=\"doc-marker\">・</span><span>クレジットカード決済の場合、クレジットカード決済へに変更する</span></div>\n1252:             <div class=\"doc-bullet\" style=\"--lv:1\"><span class=\"doc-marker\">・</span><span>支店の場合、「注文する」ボタンの文言は「購入する」に変更する</span></div>\n1253:             <div class=\"doc-bullet\" style=\"--lv:0\"><span class=\"doc-marker\">・</span><span>店頭受取、スムーズ店頭受取の場合、画面の表示切り替えをする</span></div>\n1254:             <div class=\"doc-bullet\" style=\"--lv:2\"><span class=\"doc-marker\">・</span><span>備考欄を非表示とする</span></div>\n1255:             <div class=\"doc-bullet\" style=\"--lv:2\"><span class=\"doc-marker\">・</span><span>お問合せフォームはこちらエリアを表示する</span></div>\n1256:             <div class=\"doc-bullet\" style=\"--lv:0\"><span class=\"doc-marker\">・</span><span>店頭受取、スムーズ店頭受取以外の場合、画面の表示切り替えをする</span></div>",
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

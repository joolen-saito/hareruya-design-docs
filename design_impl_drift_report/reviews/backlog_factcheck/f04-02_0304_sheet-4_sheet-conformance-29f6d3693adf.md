# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json#f04-02_0304_sheet-4_sheet-conformance-29f6d3693adf`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f04-02_0304_sheet-4_sheet.json`
- sourceFindingId: `f04-02_0304_sheet-4_sheet-conformance-29f6d3693adf`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f04-02_0304_sheet-4_sheet` / F04-02 ご注文方法指定
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: 「注文する」ボタン文言を支払方法で変更する(コンビニ決済→コンビニ決済へ／クレジットカード決済→クレジットカード決済へ／支店→購入する)。
- implementationActual: 送信ボタンは常に front.shopping.checkout(=「注文する」)固定表示。data-js-payment-submit のJSは確認チェックボックスによる活性/非活性のみでボタン文言書換なし。
- mismatchReason: index.twig:768 は固定 trans。支払方法選択(data-trigger=change)や支店で文言を変える処理が Twig にもJS(textContent書換なし)にも無く、localeに「コンビニ決済へ/クレジットカード決済へ」文言も不在。
- designRefDetail: excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-4 (No.10-10 注文するボタン/処理概要「コンビニ決済へ・クレジットカード決済へ・支店は購入する」)
- implRef: src/Eccube/Resource/template/default/Shopping/index.twig:767-769, src/Eccube/Resource/locale/messages.ja.yaml:1504, html/template/default/assets/hareruya/js/hareruya-checkout.js (data-js-payment-submit)

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f04-02_0304_sheet-4_sheet-conformance-29f6d3693adf",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-4",
  "designRefDetail": "excel_to_html/output/0304_基本設計仕様書(フロント_注文).html#sheet-4 (No.10-10 注文するボタン/処理概要「コンビニ決済へ・クレジットカード決済へ・支店は購入する」)",
  "designExpectation": "「注文する」ボタン文言を支払方法で変更する(コンビニ決済→コンビニ決済へ／クレジットカード決済→クレジットカード決済へ／支店→購入する)。",
  "designQuote": "「注文する」ボタン文言を支払方法で変更する(コンビニ決済→コンビニ決済へ／クレジットカード決済→クレジットカード決済へ／支店→購入する)。",
  "implRef": "src/Eccube/Resource/template/default/Shopping/index.twig:767-769, src/Eccube/Resource/locale/messages.ja.yaml:1504, html/template/default/assets/hareruya/js/hareruya-checkout.js (data-js-payment-submit)",
  "implementationActual": "送信ボタンは常に front.shopping.checkout(=「注文する」)固定表示。data-js-payment-submit のJSは確認チェックボックスによる活性/非活性のみでボタン文言書換なし。",
  "difference": "index.twig:768 は固定 trans。支払方法選択(data-trigger=change)や支店で文言を変える処理が Twig にもJS(textContent書換なし)にも無く、localeに「コンビニ決済へ/クレジットカード決済へ」文言も不在。",
  "mismatchReason": "index.twig:768 は固定 trans。支払方法選択(data-trigger=change)や支店で文言を変える処理が Twig にもJS(textContent書換なし)にも無く、localeに「コンビニ決済へ/クレジットカード決済へ」文言も不在。",
  "comparisonRows": [
    {
      "item": "ボタン文言(コンビニ決済)",
      "design": "コンビニ決済へ",
      "implementation": "注文する(固定)",
      "mismatch": "文言切替なし"
    },
    {
      "item": "ボタン文言(クレジットカード決済)",
      "design": "クレジットカード決済へ",
      "implementation": "注文する(固定)",
      "mismatch": "文言切替なし"
    },
    {
      "item": "ボタン文言(支店)",
      "design": "購入する",
      "implementation": "注文する(固定)",
      "mismatch": "文言切替なし"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f04-02_0304_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Shopping/index.twig:767-769, src/Eccube/Resource/locale/messages.ja.yaml:1504, html/template/default/assets/hareruya/js/hareruya-checkout.js (data-js-payment-submit)",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「「注文する」ボタン文言を支払方法で変更する(コンビニ決済→コンビニ決済へ／クレジットカード決済→クレジットカード決済へ／支店→購入する)。」。実装は「送信ボタンは常に front.shopping.checkout(=「注文する」)固定表示。data-js-payment-submit のJSは確認チェックボックスによる活性/非活性のみでボタン文言書換なし。」。乖離理由は「index.twig:768 は固定 trans。支払方法選択(data-trigger=change)や支店で文言を変える処理が Twig にもJS(textContent書換なし)にも無く、localeに「コンビニ決済へ/クレジットカード決済へ」文言も不在。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1180\n1177:       </section>\n1178:       <!-- function-design-embed:end f04-01-f04-01_front_cart_cart_index -->\n1179: </section>\n1180:       <section class=\"sheet-panel\" id=\"sheet-4\">\n1181:         <div class=\"sheet-heading\">\n1182:           <h2>ご注文方法指定</h2>\n1183:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Shopping/index.twig:767-769",
    "src/Eccube/Resource/locale/messages.ja.yaml:1504",
    "src/Eccube/Resource/template/default/Shopping/index.twig",
    "src/Eccube/Resource/locale/messages.ja.yaml",
    "html/template/default/assets/hareruya/js/hareruya-checkout.js"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Shopping/index.twig:767\n",
    "src/Eccube/Resource/locale/messages.ja.yaml:1504\n1501: admin.messenger.webhook_summary: スマレジ Webhook\n1502: admin.messenger.job_summary: Messenger ジョブ\n1503: admin.messenger.view_webhook_list: Webhook 一覧を見る\n1504: admin.messenger.webhook_list: Webhook 一覧\n1505: admin.messenger.webhook_detail: Webhook 詳細\n1506: admin.messenger.webhook_id: ID\n1507: admin.messenger.webhook_event: イベント",
    "src/Eccube/Resource/template/default/Shopping/index.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json#f06-25_0306_sheet-21_sheet-conformance-fa0c06f76207`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json`
- sourceFindingId: `f06-25_0306_sheet-21_sheet-conformance-fa0c06f76207`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f06-25_0306_sheet-21_sheet` / F06-25 店頭注文呼び出し番号表示
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: WiFiパスワードは本店ではWiFiパスワードを表示し、支店では非表示にする（本店のみに表示する）
- implementationActual: waiting_number.twig は店舗種別で分岐せず無条件に #wifi セクション(.wifiText)を描画し、waiting_monitor.js の passUpdate() も無条件に .wifiText へ hareruya{mmdd} を書き込む。両所に『本店のみWifi表示するようにする』の TODO コメントが残存。isMainShop グローバル(TwigInitializeListener.php:69 登録・他Twigでは活用済み)がWiFi…
- mismatchReason: WaitingNumberController.php・waiting_number.twig・waiting_monitor.js・TwigInitializeListener.php を確認。本店/支店を分岐する条件(isMainShop 等)がWiFi表示部(twig #wifi・JS .wifiText)に一切存在せず、TODOコメントで未対応が明示。設計の『支店では非表示(本店のみ表示)』に対し実装は全店で常時表示するため未実装と確定。
- designRefDetail: excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-21（★カスタマイズ要件「本店ではWiFiパスワードを表示する」「支店ではWiFiパスワードを非表示にする」「本店のみに表示する」/ materialGapRows row3,row4,row9）
- implRef: src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43-53 / html/template/default/assets/js/waiting_monitor.js:3-27

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f06-25_0306_sheet-21_sheet-conformance-fa0c06f76207",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-21",
  "designRefDetail": "excel_to_html/output/0306_基本設計仕様書(フロント_会員).html#sheet-21（★カスタマイズ要件「本店ではWiFiパスワードを表示する」「支店ではWiFiパスワードを非表示にする」「本店のみに表示する」/ materialGapRows row3,row4,row9）",
  "designExpectation": "WiFiパスワードは本店ではWiFiパスワードを表示し、支店では非表示にする（本店のみに表示する）",
  "designQuote": "WiFiパスワードは本店ではWiFiパスワードを表示し、支店では非表示にする（本店のみに表示する）",
  "implRef": "src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43-53 / html/template/default/assets/js/waiting_monitor.js:3-27",
  "implementationActual": "waiting_number.twig は店舗種別で分岐せず無条件に #wifi セクション(.wifiText)を描画し、waiting_monitor.js の passUpdate() も無条件に .wifiText へ hareruya{mmdd} を書き込む。両所に『本店のみWifi表示するようにする』の TODO コメントが残存。isMainShop グローバル(TwigInitializeListener.php:69 登録・他Twigでは活用済み)がWiFi表示部に一切適用されておらず、支店モニターでもWiFiパスワードが表示される。",
  "difference": "WaitingNumberController.php・waiting_number.twig・waiting_monitor.js・TwigInitializeListener.php を確認。本店/支店を分岐する条件(isMainShop 等)がWiFi表示部(twig #wifi・JS .wifiText)に一切存在せず、TODOコメントで未対応が明示。設計の『支店では非表示(本店のみ表示)』に対し実装は全店で常時表示するため未実装と確定。",
  "mismatchReason": "WaitingNumberController.php・waiting_number.twig・waiting_monitor.js・TwigInitializeListener.php を確認。本店/支店を分岐する条件(isMainShop 等)がWiFi表示部(twig #wifi・JS .wifiText)に一切存在せず、TODOコメントで未対応が明示。設計の『支店では非表示(本店のみ表示)』に対し実装は全店で常時表示するため未実装と確定。",
  "comparisonRows": [
    {
      "item": "WiFiパスワード表示条件",
      "design": "本店のみ表示・支店は非表示",
      "implementation": "全店で無条件表示(twig #wifi 無条件描画・JS .wifiText 無条件書込)",
      "mismatch": "支店でも表示される(本店限定分岐なし)"
    },
    {
      "item": "isMainShop 分岐の適用",
      "design": "本店/支店で表示可否を切替",
      "implementation": "WiFi表示部には未適用・TODOコメント残存",
      "mismatch": "分岐未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f06-25_0306_sheet-21_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43-53 / html/template/default/assets/js/waiting_monitor.js:3-27",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「WiFiパスワードは本店ではWiFiパスワードを表示し、支店では非表示にする（本店のみに表示する）」。実装は「waiting_number.twig は店舗種別で分岐せず無条件に #wifi セクション(.wifiText)を描画し、waiting_monitor.js の passUpdate() も無条件に .wifiText へ hareruya{mmdd} を書き込む。両所に『本店のみWifi表示するようにする』の TODO コメントが残存。isMainShop グローバル(TwigInitializeListener.php:69 登録・他Twigでは活用済み)がWiFi表示部に一切適用されておらず、支店モニタ…」。乖離理由は「WaitingNumberController.php・waiting_number.twig・waiting_monitor.js・TwigInitializeListener.php を確認。本店/支店を分岐する条件(isMainShop 等)がWiFi表示部(twig #wifi・JS .wifiText)に一切存在せず、TODOコメントで未対応が明示。設計の『支店では非表示(本店のみ表示)』に対し実装は全店で常時表示するため未実装と確定。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "業務ロジック・外部連携未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:6979\n6976:       </section>\n6977:       <!-- function-design-embed:end f06-24-f06-24_front_contact_history -->\n6978: </section>\n6979:       <section class=\"sheet-panel\" id=\"sheet-21\">\n6980:         <div class=\"sheet-heading\">\n6981:           <h2>店頭注文呼び出し番号表示</h2>\n6982:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43-53",
    "html/template/default/assets/js/waiting_monitor.js:3-27",
    "src/Eccube/Resource/template/default/Waiting/waiting_number.twig",
    "html/template/default/assets/js/waiting_monitor.js"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Waiting/waiting_number.twig:43\n40:                 <div class=\"p-hareruya-waiting-number__cell\"><div class=\"p-hareruya-waiting-number__value\"></div></div>\n41:                 <div class=\"p-hareruya-waiting-number__cell\"><div class=\"p-hareruya-waiting-number__value\"></div></div>\n42:             </section>\n43:             {# TODO: ECCUBE_HARERUYA-182 店頭注文呼び出し番号表示 店舗切り替えができるようになったら修正\n44:                TODO: 本店のみWifi表示するようにする #}\n45:             <section id=\"wifi\" class=\"p-hareruya-waiting-number__wifi\">\n46:                 <div class=\"p-hareruya-waiting-number__wifi-inner\">",
    "html/template/default/assets/js/waiting_monitor.js:3\n1: $(function() {\n2: \n3: \tfunction passUpdate() {\n4: \n5:         const now = new Date();\n6:         now.setMonth(now.getMonth());",
    "src/Eccube/Resource/template/default/Waiting/waiting_number.twig:1\n1: <!DOCTYPE html>\n2: <html lang=\"ja\">\n3:     <head>\n4:         <meta charset=\"UTF-8\" />"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

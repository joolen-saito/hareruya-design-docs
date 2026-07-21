# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f03-08_0303_sheet-10_sheet.json#f03-08_0303_sheet-10_sheet-conformance-ead761c82ace`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f03-08_0303_sheet-10_sheet.json`
- sourceFindingId: `f03-08_0303_sheet-10_sheet-conformance-ead761c82ace`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f03-08_0303_sheet-10_sheet` / F03-08 お気に入り
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: お気に入り登録商品一覧の表示要素として『会員氏名』を表示する。
- implementationActual: favorite.twig には見出し・リード文・商品数・並べ替え・商品グリッドはあるが会員氏名（顧客名）を表示する記述が無い。会員氏名を出力する front.mypage.welcome を含む navi.twig は history.twig からのみ include され、favorite.twig（extends default_frame.twig）/default_frame.twig では読み込まれない。
- mismatchReason: 設計は一覧の表示要素として『会員氏名』を明記するが、favorite.twig を全文 grep しても Customer/会員/氏名/様/name01 のいずれも一致無く、当該画面枠で navi.twig（welcome=会員氏名）も include されないため会員氏名が表示されない。
- designRefDetail: excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-10（『フロント挙動 表示要素: 一覧は見出し…、会員氏名、セール通知の案内、商品数、…切替、お気に入り商品の一覧』, materialGapRows row58）
- implRef: 不在（src/Eccube/Resource/template/default/Mypage/favorite.twig 全文 grep、及び navi.twig の include 状況を確認）

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f03-08_0303_sheet-10_sheet-conformance-ead761c82ace",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-10",
  "designRefDetail": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-10（『フロント挙動 表示要素: 一覧は見出し…、会員氏名、セール通知の案内、商品数、…切替、お気に入り商品の一覧』, materialGapRows row58）",
  "designExpectation": "お気に入り登録商品一覧の表示要素として『会員氏名』を表示する。",
  "designQuote": "お気に入り登録商品一覧の表示要素として『会員氏名』を表示する。",
  "implRef": "不在（src/Eccube/Resource/template/default/Mypage/favorite.twig 全文 grep、及び navi.twig の include 状況を確認）",
  "implementationActual": "favorite.twig には見出し・リード文・商品数・並べ替え・商品グリッドはあるが会員氏名（顧客名）を表示する記述が無い。会員氏名を出力する front.mypage.welcome を含む navi.twig は history.twig からのみ include され、favorite.twig（extends default_frame.twig）/default_frame.twig では読み込まれない。",
  "difference": "設計は一覧の表示要素として『会員氏名』を明記するが、favorite.twig を全文 grep しても Customer/会員/氏名/様/name01 のいずれも一致無く、当該画面枠で navi.twig（welcome=会員氏名）も include されないため会員氏名が表示されない。",
  "mismatchReason": "設計は一覧の表示要素として『会員氏名』を明記するが、favorite.twig を全文 grep しても Customer/会員/氏名/様/name01 のいずれも一致無く、当該画面枠で navi.twig（welcome=会員氏名）も include されないため会員氏名が表示されない。",
  "comparisonRows": [
    {
      "item": "会員氏名の表示",
      "design": "一覧の表示要素として会員氏名を表示",
      "implementation": "表示なし（favorite.twig に出力箇所無し・navi.twity未include）",
      "mismatch": "表示要素が未実装"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f03-08_0303_sheet-10_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（src/Eccube/Resource/template/default/Mypage/favorite.twig 全文 grep、及び navi.twig の include 状況を確認）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「お気に入り登録商品一覧の表示要素として『会員氏名』を表示する。」。実装は「favorite.twig には見出し・リード文・商品数・並べ替え・商品グリッドはあるが会員氏名（顧客名）を表示する記述が無い。会員氏名を出力する front.mypage.welcome を含む navi.twig は history.twig からのみ include され、favorite.twig（extends default_frame.twig）/default_frame.twig では読み込まれない。」。乖離理由は「設計は一覧の表示要素として『会員氏名』を明記するが、favorite.twig を全文 grep しても Customer/会員/氏名/様/name01 のいずれも一致無く、当該画面枠で navi.twig（welcome=会員氏名）も include されないため会員氏名が表示されない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:3402\n3399:       </section>\n3400:       <!-- function-design-embed:end f03-07-f03-07_front_product_product_arrival_notification -->\n3401: </section>\n3402:       <section class=\"sheet-panel\" id=\"sheet-10\">\n3403:         <div class=\"sheet-heading\">\n3404:           <h2>お気に入り</h2>\n3405:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Mypage/favorite.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Mypage/favorite.twig:1\n1: {#\n2: This file is part of EC-CUBE\n3: \n4: Copyright(c) EC-CUBE CO.,LTD. All Rights Reserved."
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

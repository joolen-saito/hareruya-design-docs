# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json#f05-01_0305_sheet-3_sheet-conformance-d14996a5c2d5`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json`
- sourceFindingId: `f05-01_0305_sheet-3_sheet-conformance-d14996a5c2d5`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-01_0305_sheet-3_sheet` / F05-01 ネット買取トップページ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: TOPの2番目のコーナーとして『強化買取』タグが付いた商品を、各タグの商品／本店公開／NM／買取価格1円以上／優先表示商品の商品コード順／最大60件の条件で表示する。
- implementationActual: TOPの2番目のコーナーは存在するが、表示対象タグが Tag::NEW_ITEMS_ID(=1, 新着/新商品) 固定で見出しも『買取新着商品』。『強化買取』のタグ定数・専用ブロック・文字列は src/ 配下・html/ 配下のいずれにも存在しない（grep 0件、Tag.php:55-71 に該当定数なし、dtb_tag.csv id1=新商品）。
- mismatchReason: 設計の★カスタマイズ要件は当該コーナーを『強化買取』タグ商品と規定するが、実装は汎用の新着(NEW_ITEMS_ID=1)タグを表示対象にしており、コーナーは在るが表示対象タグが設計と異なる。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3（★強化買取商品コーナーの表示）
- implRef: src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3,7

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-01_0305_sheet-3_sheet-conformance-d14996a5c2d5",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3（★強化買取商品コーナーの表示）",
  "designExpectation": "TOPの2番目のコーナーとして『強化買取』タグが付いた商品を、各タグの商品／本店公開／NM／買取価格1円以上／優先表示商品の商品コード順／最大60件の条件で表示する。",
  "designQuote": "TOPの2番目のコーナーとして『強化買取』タグが付いた商品を、各タグの商品／本店公開／NM／買取価格1円以上／優先表示商品の商品コード順／最大60件の条件で表示する。",
  "implRef": "src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3,7",
  "implementationActual": "TOPの2番目のコーナーは存在するが、表示対象タグが Tag::NEW_ITEMS_ID(=1, 新着/新商品) 固定で見出しも『買取新着商品』。『強化買取』のタグ定数・専用ブロック・文字列は src/ 配下・html/ 配下のいずれにも存在しない（grep 0件、Tag.php:55-71 に該当定数なし、dtb_tag.csv id1=新商品）。",
  "difference": "設計の★カスタマイズ要件は当該コーナーを『強化買取』タグ商品と規定するが、実装は汎用の新着(NEW_ITEMS_ID=1)タグを表示対象にしており、コーナーは在るが表示対象タグが設計と異なる。",
  "mismatchReason": "設計の★カスタマイズ要件は当該コーナーを『強化買取』タグ商品と規定するが、実装は汎用の新着(NEW_ITEMS_ID=1)タグを表示対象にしており、コーナーは在るが表示対象タグが設計と異なる。",
  "comparisonRows": [
    {
      "item": "2番目コーナーの表示対象タグ",
      "design": "強化買取タグ",
      "implementation": "Tag::NEW_ITEMS_ID(=1, 新着/新商品)",
      "mismatch": "設計は強化買取タグ、実装は新着タグ"
    },
    {
      "item": "コーナー見出し",
      "design": "強化買取商品コーナー",
      "implementation": "買取新着商品",
      "mismatch": "見出しが異なる"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-01_0305_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3,7",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「TOPの2番目のコーナーとして『強化買取』タグが付いた商品を、各タグの商品／本店公開／NM／買取価格1円以上／優先表示商品の商品コード順／最大60件の条件で表示する。」。実装は「TOPの2番目のコーナーは存在するが、表示対象タグが Tag::NEW_ITEMS_ID(=1, 新着/新商品) 固定で見出しも『買取新着商品』。『強化買取』のタグ定数・専用ブロック・文字列は src/ 配下・html/ 配下のいずれにも存在しない（grep 0件、Tag.php:55-71 に該当定数なし、dtb_tag.csv id1=新商品）。」。乖離理由は「設計の★カスタマイズ要件は当該コーナーを『強化買取』タグ商品と規定するが、実装は汎用の新着(NEW_ITEMS_ID=1)タグを表示対象にしており、コーナーは在るが表示対象タグが設計と異なる。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:851\n848:           </div>\n849:         </div>\n850:       </section>\n851:       <section class=\"sheet-panel\" id=\"sheet-3\">\n852:         <div class=\"sheet-heading\">\n853:           <h2>ネット買取トップページ</h2>\n854:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3,7",
    "src/Eccube/Resource/template/default/Block/purchase_new_product.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Block/purchase_new_product.twig:3\n1: {# 買取TOP「買取新着商品」: tagged UniSearch (tagId=新着) #}\n2: \n3: {% set tagUnisearch = tagged_unisearch_request(constant('Eccube\\\\Entity\\\\Tag::NEW_ITEMS_ID'), purchaseUnisearchPageSize|default(60), true) %}\n4: \n5: <section class=\"ec-purchaseTop__newItems\">\n6:     <h2 class=\"ec-purchaseTop__newItems__title\">",
    "src/Eccube/Resource/template/default/Block/purchase_new_product.twig:1\n1: {# 買取TOP「買取新着商品」: tagged UniSearch (tagId=新着) #}\n2: \n3: {% set tagUnisearch = tagged_unisearch_request(constant('Eccube\\\\Entity\\\\Tag::NEW_ITEMS_ID'), purchaseUnisearchPageSize|default(60), true) %}\n4: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

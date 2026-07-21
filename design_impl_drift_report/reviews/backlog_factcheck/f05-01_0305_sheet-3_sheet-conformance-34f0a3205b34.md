# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json#f05-01_0305_sheet-3_sheet-conformance-34f0a3205b34`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json`
- sourceFindingId: `f05-01_0305_sheet-3_sheet-conformance-34f0a3205b34`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-01_0305_sheet-3_sheet` / F05-01 ネット買取トップページ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 強化買取／買取特集／目玉買取の各コーナーの商品表示順は、商品管理＞タグ登録で設定できる『優先表示商品』の商品コード順とする。
- implementationActual: isBuy=true の買取タグブロック（3コーナーが使用）は query['sort']='release_date' を無条件付与し、UniSearch へ 'release_date desc,product desc,...'（発売日降順）を要求する。優先表示商品(Tag::priorityProducts, Tag.php:221)や商品コード順を並び順として渡す処理はなく、DB検索側 TagSubscriber.php:42-68 の優先表示商品ロジックも全てコ…
- mismatchReason: 設計指定の並び順（優先表示商品の商品コード順）と、実装が要求するソート（発売日降順）が矛盾。優先表示商品順・DtbTagSort・商品コード順を参照する処理がクエリ組立に存在しない。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3（★各コーナー 条件5：優先表示商品の商品コード順）
- implRef: src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:72-73, src/Eccube/Service/UniSearch/UniSearchService.php:322-324

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-01_0305_sheet-3_sheet-conformance-34f0a3205b34",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-3（★各コーナー 条件5：優先表示商品の商品コード順）",
  "designExpectation": "強化買取／買取特集／目玉買取の各コーナーの商品表示順は、商品管理＞タグ登録で設定できる『優先表示商品』の商品コード順とする。",
  "designQuote": "強化買取／買取特集／目玉買取の各コーナーの商品表示順は、商品管理＞タグ登録で設定できる『優先表示商品』の商品コード順とする。",
  "implRef": "src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:72-73, src/Eccube/Service/UniSearch/UniSearchService.php:322-324",
  "implementationActual": "isBuy=true の買取タグブロック（3コーナーが使用）は query['sort']='release_date' を無条件付与し、UniSearch へ 'release_date desc,product desc,...'（発売日降順）を要求する。優先表示商品(Tag::priorityProducts, Tag.php:221)や商品コード順を並び順として渡す処理はなく、DB検索側 TagSubscriber.php:42-68 の優先表示商品ロジックも全てコメントアウト(TODO)。",
  "difference": "設計指定の並び順（優先表示商品の商品コード順）と、実装が要求するソート（発売日降順）が矛盾。優先表示商品順・DtbTagSort・商品コード順を参照する処理がクエリ組立に存在しない。",
  "mismatchReason": "設計指定の並び順（優先表示商品の商品コード順）と、実装が要求するソート（発売日降順）が矛盾。優先表示商品順・DtbTagSort・商品コード順を参照する処理がクエリ組立に存在しない。",
  "comparisonRows": [
    {
      "item": "各コーナーの並び順",
      "design": "優先表示商品の商品コード順",
      "implementation": "release_date desc（発売日降順）",
      "mismatch": "並び順が異なる"
    },
    {
      "item": "優先表示商品(priorityProducts)の適用",
      "design": "適用する",
      "implementation": "クエリ組立で未参照（DB側TagSubscriberもコメントアウト）",
      "mismatch": "未適用"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-01_0305_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:72-73, src/Eccube/Service/UniSearch/UniSearchService.php:322-324",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「強化買取／買取特集／目玉買取の各コーナーの商品表示順は、商品管理＞タグ登録で設定できる『優先表示商品』の商品コード順とする。」。実装は「isBuy=true の買取タグブロック（3コーナーが使用）は query['sort']='release_date' を無条件付与し、UniSearch へ 'release_date desc,product desc,...'（発売日降順）を要求する。優先表示商品(Tag::priorityProducts, Tag.php:221)や商品コード順を並び順として渡す処理はなく、DB検索側 TagSubscriber.php:42-68 の優先表示商品ロジックも全てコメントアウト(TODO)。」。乖離理由は「設計指定の並び順（優先表示商品の商品コード順）と、実装が要求するソート（発売日降順）が矛盾。優先表示商品順・DtbTagSort・商品コード順を参照する処理がクエリ組立に存在しない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "DB・保存/更新処理未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:851\n848:           </div>\n849:         </div>\n850:       </section>\n851:       <section class=\"sheet-panel\" id=\"sheet-3\">\n852:         <div class=\"sheet-heading\">\n853:           <h2>ネット買取トップページ</h2>\n854:         </div>",
  "implementationRefs": [
    "src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:72-73",
    "src/Eccube/Service/UniSearch/UniSearchService.php:322-324",
    "src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php",
    "src/Eccube/Service/UniSearch/UniSearchService.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:72\n69:             'page' => UniSearchService::DEFAULT_PAGE,\n70:             'pageSize' => $pageSize,\n71:         ];\n72:         if ($isBuy) {\n73:             $query['sort'] = 'release_date';\n74:         }\n75: ",
    "src/Eccube/Service/UniSearch/UniSearchService.php:322\n319:         } elseif ($sortKey === 'price') {\n320:             $order = !isset($query['order']) || !array_key_exists($query['order'], self::VALID_ORDERS) ? 'asc' : self::VALID_ORDERS[$query['order']];\n321:             $params[] = 'sort='.urlencode('price '.$order.',color_sequence asc,card_name '.$order.',language asc,foil_flg asc');\n322:         } elseif ($sortKey === 'release_date') {\n323:             // query['order'] は参照しない（昇降は次行の固定文字列で表現済み）\n324:             $params[] = 'sort='.urlencode('release_date desc,product desc,language asc,foil_flg asc');\n325:         } elseif ($sortKey === self::QUERY_SORT_BUY_PRICE) {",
    "src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:26\n23:  * タグブロック用: ユニサーチAPI向けクエリ文字列を組み立てる。\n24:  * テンプレートではタグIDと件数(任意)を指定する。\n25:  */\n26: class TaggedUnisearchRequestExtension extends AbstractExtension\n27: {\n28:     private const DEFAULT_BLOCK_PAGE_SIZE = 30;\n29: "
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

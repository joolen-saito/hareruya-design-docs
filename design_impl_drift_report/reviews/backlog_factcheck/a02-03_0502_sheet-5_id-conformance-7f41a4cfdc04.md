# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a02-03_0502_sheet-5_id.json#a02-03_0502_sheet-5_id-conformance-7f41a4cfdc04`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a02-03_0502_sheet-5_id.json`
- sourceFindingId: `a02-03_0502_sheet-5_id-conformance-7f41a4cfdc04`
- function: `a02-03_0502_sheet-5_id` / A02-03 ポップアップ用商品情報取得（旧商品ID）
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: A02-03（旧商品ID・言語指定なし）の成功レスポンスは productId, name, productClassId, price01, price02, stock, nameEn, fileName, cardId を返す。cardId は mtb_card.id を返す。
- implementationActual: レスポンスビルダーは productId/name/productClassId/price01/price02/stock/nameEn/subFileName/fileName/code/conditionCode/weeklySold/productUrl/beltUrl を返し、cardId は返さない。Repository 側 SELECT/RSM にも cardId がない。
- mismatchReason: 設計で必須の cardId が実装レスポンスに存在しない。一方で設計詳細のA02-03成功レスポンスにない subFileName/code/conditionCode/weeklySold/productUrl/beltUrl が返る。
- designRefDetail: 
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:29-49 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2384-2435

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a02-03_0502_sheet-5_id-conformance-7f41a4cfdc04",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-5:1360,1379,1393,1404",
  "designRefDetail": null,
  "designExpectation": "A02-03（旧商品ID・言語指定なし）の成功レスポンスは productId, name, productClassId, price01, price02, stock, nameEn, fileName, cardId を返す。cardId は mtb_card.id を返す。",
  "designQuote": "A02-03（旧商品ID・言語指定なし）の成功レスポンスは productId, name, productClassId, price01, price02, stock, nameEn, fileName, cardId を返す。cardId は mtb_card.id を返す。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:29-49 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2384-2435",
  "implementationActual": "レスポンスビルダーは productId/name/productClassId/price01/price02/stock/nameEn/subFileName/fileName/code/conditionCode/weeklySold/productUrl/beltUrl を返し、cardId は返さない。Repository 側 SELECT/RSM にも cardId がない。",
  "difference": "設計で必須の cardId が実装レスポンスに存在しない。一方で設計詳細のA02-03成功レスポンスにない subFileName/code/conditionCode/weeklySold/productUrl/beltUrl が返る。",
  "mismatchReason": "設計で必須の cardId が実装レスポンスに存在しない。一方で設計詳細のA02-03成功レスポンスにない subFileName/code/conditionCode/weeklySold/productUrl/beltUrl が返る。",
  "comparisonRows": [
    {
      "item": "cardId",
      "design": "紐づくカードIDとして cardId を返す",
      "implementation": "Repository SELECT と PopupResponseBuilder に cardId なし",
      "mismatch": "必須応答フィールド欠落"
    },
    {
      "item": "追加フィールド",
      "design": "詳細設計の成功レスポンスは 9 項目",
      "implementation": "subFileName, code, conditionCode, weeklySold, productUrl, beltUrl も返却",
      "mismatch": "詳細設計のレスポンス契約より多い"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a02-03_0502_sheet-5_id",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:29-49 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2384-2435",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「A02-03（旧商品ID・言語指定なし）の成功レスポンスは productId, name, productClassId, price01, price02, stock, nameEn, fileName, cardId を返す。cardId は mtb_card.id を返す。」。実装は「レスポンスビルダーは productId/name/productClassId/price01/price02/stock/nameEn/subFileName/fileName/code/conditionCode/weeklySold/productUrl/beltUrl を返し、cardId は返さない。Repository 側 SELECT/RSM にも cardId がない。」。乖離理由は「設計で必須の cardId が実装レスポンスに存在しない。一方で設計詳細のA02-03成功レスポンスにない subFileName/code/conditionCode/weeklySold/productUrl/beltUrl が返る。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Form・入力項目",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:29-49",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2384-2435",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/App/Popup/PopupResponseBuilder.php:29\n26:      */\n27:     public function build(array $result, string $productUrl, bool $includeBeltUrl = false): array\n28:     {\n29:         $response = [\n30:             'productId' => $result['productId'],\n31:             'name' => $result['productName'],\n32:             'productClassId' => $result['productClassId'],",
    "src/Eccube/Repository/ProductRepository.php:2384\n2381:     public function findPopupProductByOldProductIdWithoutLang(string $oldProductId): ?array\n2382:     {\n2383:         $sql = <<<SQL\n2384: SELECT\n2385:     p.id AS productId,\n2386:     p.name AS productName,\n2387:     p.name_en AS nameEn,",
    "src/Eccube/Service/App/Popup/PopupResponseBuilder.php:18\n15: \n16: namespace Eccube\\Service\\App\\Popup;\n17: \n18: class PopupResponseBuilder\n19: {\n20:     /**\n21:      * ポップアップ用情報のレスポンスを構築する"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

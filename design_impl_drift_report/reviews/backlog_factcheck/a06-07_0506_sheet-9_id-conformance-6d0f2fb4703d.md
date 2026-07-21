# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a06-07_0506_sheet-9_id.json#a06-07_0506_sheet-9_id-conformance-6d0f2fb4703d`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a06-07_0506_sheet-9_id.json`
- sourceFindingId: `a06-07_0506_sheet-9_id-conformance-6d0f2fb4703d`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `a06-07_0506_sheet-9_id` / A06-07 商品IDリストから買取用商品情報を取得
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: レスポンスの conditionClasses.<conditionCode> は productClassId, productCode, buyPrice, price, stock, sectionId を返す。foilFlg は boolean、price と stock は string とする。
- implementationActual: conditionClasses 配下は productClassCode を返し、productCode は返さない。foilFlg は DTO の int をそのまま返し、price は standardPrice、stock は int として返す。
- mismatchReason: 設計サンプルおよびレスポンス定義の外部フィールド名・型と、実装の formatter が生成するキー・型が一致しない。Repository は productClass.code AS productClassCode を選択し、formatter も productClassCode キーで返しているため productCode は不在。探索範囲: Service/App/MTGBuyer/V1/BuyingCardsFormatter.php, Dto/Reposito…
- designRefDetail: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-9:2307
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:88, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:113

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a06-07_0506_sheet-9_id-conformance-6d0f2fb4703d",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-9:2307",
  "designRefDetail": null,
  "designExpectation": "レスポンスの conditionClasses.<conditionCode> は productClassId, productCode, buyPrice, price, stock, sectionId を返す。foilFlg は boolean、price と stock は string とする。",
  "designQuote": "レスポンスの conditionClasses.<conditionCode> は productClassId, productCode, buyPrice, price, stock, sectionId を返す。foilFlg は boolean、price と stock は string とする。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:88, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:113",
  "implementationActual": "conditionClasses 配下は productClassCode を返し、productCode は返さない。foilFlg は DTO の int をそのまま返し、price は standardPrice、stock は int として返す。",
  "difference": "設計サンプルおよびレスポンス定義の外部フィールド名・型と、実装の formatter が生成するキー・型が一致しない。Repository は productClass.code AS productClassCode を選択し、formatter も productClassCode キーで返しているため productCode は不在。探索範囲: Service/App/MTGBuyer/V1/BuyingCardsFormatter.php, Dto/Repository/Master/GetBuyingCardsQueryResponseDto.php, Repository/Master/MtbCardRepository.php。",
  "mismatchReason": "設計サンプルおよびレスポンス定義の外部フィールド名・型と、実装の formatter が生成するキー・型が一致しない。Repository は productClass.code AS productClassCode を選択し、formatter も productClassCode キーで返しているため productCode は不在。探索範囲: Service/App/MTGBuyer/V1/BuyingCardsFormatter.php, Dto/Repository/Master/GetBuyingC…",
  "comparisonRows": [
    {
      "item": "商品コードフィールド",
      "design": "productCode",
      "implementation": "productClassCode",
      "mismatch": "キー名が異なる"
    },
    {
      "item": "foilFlg",
      "design": "boolean",
      "implementation": "int の foilFlg をそのまま返す",
      "mismatch": "型が異なる可能性が高い"
    },
    {
      "item": "price",
      "design": "string",
      "implementation": "int|null の standardPrice を price として返す",
      "mismatch": "型が異なる"
    },
    {
      "item": "stock",
      "design": "string",
      "implementation": "int の stock を返す",
      "mismatch": "型が異なる"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a06-07_0506_sheet-9_id",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:88, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:113",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「レスポンスの conditionClasses.<conditionCode> は productClassId, productCode, buyPrice, price, stock, sectionId を返す。foilFlg は boolean、price と stock は string とする。」。実装は「conditionClasses 配下は productClassCode を返し、productCode は返さない。foilFlg は DTO の int をそのまま返し、price は standardPrice、stock は int として返す。」。乖離理由は「設計サンプルおよびレスポンス定義の外部フィールド名・型と、実装の formatter が生成するキー・型が一致しない。Repository は productClass.code AS productClassCode を選択し、formatter も productClassCode キーで返しているため productCode は不在。探索範囲: Service/App/MTGBuyer/V1/BuyingCardsFormatter.php, Dto/Repository/Master/GetBuyingC…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Form・入力項目",
    "Service・業務ルール",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:88",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:113",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:88\n85:                 $cards[$cardId]['details'][$detailId] = [\n86:                     'cardsetCode' => $dto->cardSetCode,\n87:                     'cardsetName' => $dto->cardSetNameJp,\n88:                     'foilFlg' => $dto->foilFlg,\n89:                     'cardNo' => $dto->cardNo,\n90:                     'promotionName' => $dto->promotionNameJp,\n91:                     'productId' => $dto->productId,",
    "src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:113\n110:             }\n111: \n112:             // ProductClass情報を追加\n113:             $cards[$cardId]['details'][$detailId]['languageClasses'][$languageCode]['conditionClasses'][$conditionCode] = [\n114:                 'productClassId' => $dto->productClassId,\n115:                 'productClassCode' => $dto->productClassCode,\n116:                 'buyPrice' => $dto->buyPrice,",
    "src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:20\n17: \n18: use Eccube\\Dto\\Repository\\Master\\GetBuyingCardsQueryResponseDto;\n19: \n20: class BuyingCardsFormatter\n21: {\n22:     /**\n23:      * フラットな配列を階層構造の連想配列に変換"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/a02-02_0502_sheet-4_sheet.json#a02-02_0502_sheet-4_sheet-conformance-9bf3c4e01752`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/a02-02_0502_sheet-4_sheet.json`
- sourceFindingId: `a02-02_0502_sheet-4_sheet-conformance-9bf3c4e01752`
- function: `a02-02_0502_sheet-4_sheet` / A02-02 ポップアップ用カード情報取得
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: パスのカードID・言語、クエリのフォイル有無（foil_flg）・価格（price）を受け取り、当該カードID・言語・フォイル有無・価格に対応するポップアップ用商品情報を取得する。foil_flg指定時はフォイル区分の並び順に反映し、price=highで販売価格の降順、それ以外で昇順に並べる。
- implementationActual: カードIDAPIは /api/popup/card/{lang}/{cardId} として存在し、cardId/langのみを ProductRepository::findPopupProductByCardId($cardId, $languageCode) に渡す。Requestを受け取らず foil_flg / price クエリを読まない。リポジトリ側も引数は cardId と languageCode のみで、ORDER BY は cd.foil_flg ASC…
- mismatchReason: 設計は foil_flg と price を外部契約のクエリ条件として定義しているが、Controllerシグネチャと呼び出しに Request/query 取得がなく、Repositoryのメソッド引数・SQLにもクエリ条件が存在しない。別キーワード（foil_flg, price, query->get, findPopupProductByCardId）で再検索しても、A02-02のController/Repository内にクエリ反映実装は見つからなかった。
- designRefDetail: 
- implRef: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:278, /home/y-saito/Developments/ec-cube-enterp…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "a02-02_0502_sheet-4_sheet-conformance-9bf3c4e01752",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-4:1171,1178",
  "designRefDetail": null,
  "designExpectation": "パスのカードID・言語、クエリのフォイル有無（foil_flg）・価格（price）を受け取り、当該カードID・言語・フォイル有無・価格に対応するポップアップ用商品情報を取得する。foil_flg指定時はフォイル区分の並び順に反映し、price=highで販売価格の降順、それ以外で昇順に並べる。",
  "designQuote": "パスのカードID・言語、クエリのフォイル有無（foil_flg）・価格（price）を受け取り、当該カードID・言語・フォイル有無・価格に対応するポップアップ用商品情報を取得する。foil_flg指定時はフォイル区分の並び順に反映し、price=highで販売価格の降順、それ以外で昇順に並べる。",
  "implRef": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:278, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2226",
  "implementationActual": "カードIDAPIは /api/popup/card/{lang}/{cardId} として存在し、cardId/langのみを ProductRepository::findPopupProductByCardId($cardId, $languageCode) に渡す。Requestを受け取らず foil_flg / price クエリを読まない。リポジトリ側も引数は cardId と languageCode のみで、ORDER BY は cd.foil_flg ASC 固定、price02の昇降順指定は無い。",
  "difference": "設計は foil_flg と price を外部契約のクエリ条件として定義しているが、Controllerシグネチャと呼び出しに Request/query 取得がなく、Repositoryのメソッド引数・SQLにもクエリ条件が存在しない。別キーワード（foil_flg, price, query->get, findPopupProductByCardId）で再検索しても、A02-02のController/Repository内にクエリ反映実装は見つからなかった。",
  "mismatchReason": "設計は foil_flg と price を外部契約のクエリ条件として定義しているが、Controllerシグネチャと呼び出しに Request/query 取得がなく、Repositoryのメソッド引数・SQLにもクエリ条件が存在しない。別キーワード（foil_flg, price, query->get, findPopupProductByCardId）で再検索しても、A02-02のController/Repository内にクエリ反映実装は見つからなかった。",
  "comparisonRows": [
    {
      "item": "foil_flg クエリ",
      "design": "任意。指定時はフォイル区分の並び順に反映する（真値で降順、偽値で昇順）。未指定時は非フォイル優先。",
      "implementation": "ControllerはRequestを受け取らず query->get('foil_flg') が無い。Repositoryは cd.foil_flg ASC 固定。",
      "mismatch": "指定値による昇降順切替が実装されていない。"
    },
    {
      "item": "price クエリ",
      "design": "任意。highで販売価格の降順、それ以外で昇順。未指定時は価格での並びを行わない。",
      "implementation": "Controllerは query->get('price') が無く、RepositoryのORDER BYに price02 のクエリ連動昇降順が無い。",
      "mismatch": "価格条件による並び指定が実装されていない。"
    },
    {
      "item": "取得条件",
      "design": "カードID・言語・フォイル有無・価格に対応する商品情報を取得する。",
      "implementation": "cardId と languageCode のみで findPopupProductByCardId を実行する。",
      "mismatch": "設計上の4条件のうち2条件が呼び出し・SQLに渡っていない。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "a02-02_0502_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:278, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2226",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「パスのカードID・言語、クエリのフォイル有無（foil_flg）・価格（price）を受け取り、当該カードID・言語・フォイル有無・価格に対応するポップアップ用商品情報を取得する。foil_flg指定時はフォイル区分の並び順に反映し、price=highで販売価格の降順、それ以外で昇順に並べる。」。実装は「カードIDAPIは /api/popup/card/{lang}/{cardId} として存在し、cardId/langのみを ProductRepository::findPopupProductByCardId($cardId, $languageCode) に渡す。Requestを受け取らず foil_flg / price クエリを読まない。リポジトリ側も引数は cardId と languageCode のみで、ORDER BY は cd.foil_flg ASC 固定、price02の昇降順指定は無い。」。乖離理由は「設計は foil_flg と price を外部契約のクエリ条件として定義しているが、Controllerシグネチャと呼び出しに Request/query 取得がなく、Repositoryのメソッド引数・SQLにもクエリ条件が存在しない。別キーワード（foil_flg, price, query->get, findPopupProductByCardId）で再検索しても、A02-02のController/Repository内にクエリ反映実装は見つからなかった。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Repository・Entity・DB",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:278",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2226",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php",
    "/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/App/ProductController.php:265\n262:      *\n263:      * @return JsonResponse\n264:      */\n265:     #[Route(path: '/api/popup/card/{lang}/{cardId}', name: 'popup_product_by_card_id', methods: ['GET'])]\n266:     public function getPopupProductByCardId(string $lang, string $cardId): JsonResponse\n267:     {\n268:         try {",
    "src/Eccube/Controller/App/ProductController.php:278\n275:                 default => 'EN',\n276:             };\n277: \n278:             $result = $this->productRepository->findPopupProductByCardId((int) $cardId, $languageCode);\n279:             if ($result === null) {\n280:                 throw new NotFoundException('Not Found');\n281:             }",
    "src/Eccube/Repository/ProductRepository.php:2226\n2223:      *\n2224:      * @return array<string, mixed>|null\n2225:      */\n2226:     public function findPopupProductByCardId(int $cardId, string $languageCode): ?array\n2227:     {\n2228:         $sql = <<<SQL\n2229: SELECT"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

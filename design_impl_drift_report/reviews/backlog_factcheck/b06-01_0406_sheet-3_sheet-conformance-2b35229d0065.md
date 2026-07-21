# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/b06-01_0406_sheet-3_sheet.json#b06-01_0406_sheet-3_sheet-conformance-2b35229d0065`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/b06-01_0406_sheet-3_sheet.json`
- sourceFindingId: `b06-01_0406_sheet-3_sheet-conformance-2b35229d0065`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `b06-01_0406_sheet-3_sheet` / B06-01 【新規】買取自動入庫バッチ
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・未実装

## Finding Fields
- designExpectation: ネット買取は dtb_buy_order_stock ・ dtb_buy_order_stock_history、店頭買取は dtb_otc_buy_order_stock ・ dtb_otc_buy_order_stock_history。在庫数は dtb_product_class.stock ・ dtb_product_stock.stock を更新する。
- implementationActual: 自動入庫処理で在庫数を更新しているのは ProductStockEntityManager::save の ProductStock->setStock のみ。StockHistory は登録されるが、dtb_product_class.stock を更新する処理は確認できない。
- mismatchReason: 設計は dtb_product_class.stock と dtb_product_stock.stock の両方の在庫数更新を要求している。実装では ProductStockEntityManager が ProductStock の stock だけを更新し、ProductClass 側の stock 更新または dtb_product_class.stock 更新SQLがない。反証として自動入庫サービス、EntityManager、Repository を setSt…
- designRefDetail: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-3:928
- implRef: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/…

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "b06-01_0406_sheet-3_sheet-conformance-2b35229d0065",
  "dimension": "⑦要求網羅・未実装",
  "severity": "med",
  "designRef": "/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0406_基本設計仕様書(バッチ_店頭買取管理) .html#sheet-3:928",
  "designRefDetail": null,
  "designExpectation": "ネット買取は dtb_buy_order_stock ・ dtb_buy_order_stock_history、店頭買取は dtb_otc_buy_order_stock ・ dtb_otc_buy_order_stock_history。在庫数は dtb_product_class.stock ・ dtb_product_stock.stock を更新する。",
  "designQuote": "ネット買取は dtb_buy_order_stock ・ dtb_buy_order_stock_history、店頭買取は dtb_otc_buy_order_stock ・ dtb_otc_buy_order_stock_history。在庫数は dtb_product_class.stock ・ dtb_product_stock.stock を更新する。",
  "implRef": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository。検索語: setStock(, ProductClass.*setStock, dtb_product_class.stock, ProductClassRepository.*stock）",
  "implementationActual": "自動入庫処理で在庫数を更新しているのは ProductStockEntityManager::save の ProductStock->setStock のみ。StockHistory は登録されるが、dtb_product_class.stock を更新する処理は確認できない。",
  "difference": "設計は dtb_product_class.stock と dtb_product_stock.stock の両方の在庫数更新を要求している。実装では ProductStockEntityManager が ProductStock の stock だけを更新し、ProductClass 側の stock 更新または dtb_product_class.stock 更新SQLがない。反証として自動入庫サービス、EntityManager、Repository を setStock/ProductClass/dtb_product_class.stock で再検索したが、対象更新は見つからなかった。",
  "mismatchReason": "設計は dtb_product_class.stock と dtb_product_stock.stock の両方の在庫数更新を要求している。実装では ProductStockEntityManager が ProductStock の stock だけを更新し、ProductClass 側の stock 更新または dtb_product_class.stock 更新SQLがない。反証として自動入庫サービス、EntityManager、Repository を setStock/ProductClass/dtb…",
  "comparisonRows": [
    {
      "item": "dtb_product_stock.stock",
      "design": "更新する",
      "implementation": "ProductStockEntityManager::save で ProductStock->setStock($stock) を実行",
      "mismatch": "差異なし。"
    },
    {
      "item": "dtb_product_class.stock",
      "design": "更新する",
      "implementation": "自動入庫処理内に ProductClass stock 更新処理なし",
      "mismatch": "設計要求が未実装。"
    },
    {
      "item": "履歴登録",
      "design": "在庫履歴を登録する",
      "implementation": "StockHistoryEntityManager::save を店頭・ネット双方で呼び出し",
      "mismatch": "差異なし。"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "b06-01_0406_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository。検索語: setStock(, ProductClass.*setStock, dtb_product_class.stock, ProductClassRepository.*stock）",
  "comparisonSummary": "⑦要求網羅・未実装：設計は「ネット買取は dtb_buy_order_stock ・ dtb_buy_order_stock_history、店頭買取は dtb_otc_buy_order_stock ・ dtb_otc_buy_order_stock_history。在庫数は dtb_product_class.stock ・ dtb_product_stock.stock を更新する。」。実装は「自動入庫処理で在庫数を更新しているのは ProductStockEntityManager::save の ProductStock->setStock のみ。StockHistory は登録されるが、dtb_product_class.stock を更新する処理は確認できない。」。乖離理由は「設計は dtb_product_class.stock と dtb_product_stock.stock の両方の在庫数更新を要求している。実装では ProductStockEntityManager が ProductStock の stock だけを更新し、ProductClass 側の stock 更新または dtb_product_class.stock 更新SQLがない。反証として自動入庫サービス、EntityManager、Repository を setStock/ProductClass/dtb…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Repository・Entity・DB"
  ],
  "designSnippet": "",
  "implementationRefs": [
    "不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/OtcBuyOrder, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Purchase, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository。検索語: setStock(, ProductClass.*setStock, dtb_product_class.stock, ProductClassRepository.*stock）"
  ],
  "implementationSnippets": [],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

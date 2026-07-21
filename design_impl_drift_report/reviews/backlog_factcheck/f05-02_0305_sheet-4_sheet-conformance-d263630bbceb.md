# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-02_0305_sheet-4_sheet.json#f05-02_0305_sheet-4_sheet-conformance-d263630bbceb`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-02_0305_sheet-4_sheet.json`
- sourceFindingId: `f05-02_0305_sheet-4_sheet-conformance-d263630bbceb`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-02_0305_sheet-4_sheet` / F05-02 ネット買取商品検索
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: ★ SEO対策として、タグやカテゴリの検索条件は「/tag/category」のようにURLのパスに含め、それ以外の検索条件は「?key=value」のようにGETパラメータとして扱う。例: https://~/purchase/search/New%20Items/Single%20Cards（カスタマイズ要件・機能仕様★の両方に明記）
- implementationActual: 買取詳細検索のルートは #[Route(path: '/purchase/search', name: 'purchase_search', methods: ['GET'])] のみで、タグ・カテゴリを含む全条件をGETクエリパラメータ（purchaseFlg=1・tags 等）で受け渡す。パス変数を持つ /purchase/search/{tag}/{category} 相当のSEO用ルートは存在しない。CategorySidebarLinkContext::forPu…
- mismatchReason: 設計★が要求するタグ・カテゴリのURLパス埋め込み（/tag/category 形式のSEO対策URL）が買取検索実装に存在しない。PurchaseController の全ルート(:139-1173, search は :399)、CategorySidebarLinkContext、purchase系ルーティング(PHP属性/yaml)を探索したが /purchase/search 配下にパス変数tag/categoryを持つルートは皆無で、Twigフォームも一律 ur…
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-4 (カスタマイズ説明『検索条件のURL形式について』および 機能仕様 処理概要★)
- implRef: src/Eccube/Controller/Front/Purchase/PurchaseController.php:399 ; src/Eccube/Service/App/Category/CategorySidebarLinkContext.php:42-50

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-02_0305_sheet-4_sheet-conformance-d263630bbceb",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-4",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-4 (カスタマイズ説明『検索条件のURL形式について』および 機能仕様 処理概要★)",
  "designExpectation": "★ SEO対策として、タグやカテゴリの検索条件は「/tag/category」のようにURLのパスに含め、それ以外の検索条件は「?key=value」のようにGETパラメータとして扱う。例: https://~/purchase/search/New%20Items/Single%20Cards（カスタマイズ要件・機能仕様★の両方に明記）",
  "designQuote": "★ SEO対策として、タグやカテゴリの検索条件は「/tag/category」のようにURLのパスに含め、それ以外の検索条件は「?key=value」のようにGETパラメータとして扱う。例: https://~/purchase/search/New%20Items/Single%20Cards（カスタマイズ要件・機能仕様★の両方に明記）",
  "implRef": "src/Eccube/Controller/Front/Purchase/PurchaseController.php:399 ; src/Eccube/Service/App/Category/CategorySidebarLinkContext.php:42-50",
  "implementationActual": "買取詳細検索のルートは #[Route(path: '/purchase/search', name: 'purchase_search', methods: ['GET'])] のみで、タグ・カテゴリを含む全条件をGETクエリパラメータ（purchaseFlg=1・tags 等）で受け渡す。パス変数を持つ /purchase/search/{tag}/{category} 相当のSEO用ルートは存在しない。CategorySidebarLinkContext::forPurchase() も listRoute/queryRoute とも 'purchase_search' を指し defaultQueryParams=['purchaseFlg'=>true] とクエリ方式。Twig(search.twig:89, purchase_detailed_search_modal.twig:13, search_purchase.twig:14)のフォームも method=get・action=url('purchase_search')。販売側(ProductController.php:136-138)には /products/search/cate/{categoryId}/tag/{tagId} 等のパス型ルートが存在するがID指定であり買取側には未適用。",
  "difference": "設計★が要求するタグ・カテゴリのURLパス埋め込み（/tag/category 形式のSEO対策URL）が買取検索実装に存在しない。PurchaseController の全ルート(:139-1173, search は :399)、CategorySidebarLinkContext、purchase系ルーティング(PHP属性/yaml)を探索したが /purchase/search 配下にパス変数tag/categoryを持つルートは皆無で、Twigフォームも一律 url('purchase_search') クエリ送信。設計Excelの★カスタマイズはSEO用パスURLへの変更を新規要件として明示しており、その要件が未反映。実装は存在するが設計と食い違うため実装違いとして確定。",
  "mismatchReason": "設計★が要求するタグ・カテゴリのURLパス埋め込み（/tag/category 形式のSEO対策URL）が買取検索実装に存在しない。PurchaseController の全ルート(:139-1173, search は :399)、CategorySidebarLinkContext、purchase系ルーティング(PHP属性/yaml)を探索したが /purchase/search 配下にパス変数tag/categoryを持つルートは皆無で、Twigフォームも一律 url('purchase_search')…",
  "comparisonRows": [
    {
      "item": "タグ/カテゴリ検索のURL形式",
      "design": "URLパスに埋め込む（例: /purchase/search/New%20Items/Single%20Cards）",
      "implementation": "GETクエリパラメータ（/purchase/search?tags=...&purchaseFlg=1 等）",
      "mismatch": "パス埋め込みのSEO用ルートが不在、クエリ方式のまま"
    },
    {
      "item": "買取検索ルート定義",
      "design": "/purchase/search/{tag}/{category} 相当のパス型ルートを想定",
      "implementation": "PurchaseController.php:399 の /purchase/search のみ（パス変数なし）",
      "mismatch": "パス変数を持つルートが未定義"
    },
    {
      "item": "カテゴリ/タグ導線の生成",
      "design": "パス型URLでリンク生成",
      "implementation": "CategorySidebarLinkContext::forPurchase() が queryRoute='purchase_search'・defaultQueryParams=['purchaseFlg'=>true] でクエリ型リンク生成",
      "mismatch": "クエリ型リンク生成のためSEO用パスURLにならない"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-02_0305_sheet-4_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Controller/Front/Purchase/PurchaseController.php:399 ; src/Eccube/Service/App/Category/CategorySidebarLinkContext.php:42-50",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「★ SEO対策として、タグやカテゴリの検索条件は「/tag/category」のようにURLのパスに含め、それ以外の検索条件は「?key=value」のようにGETパラメータとして扱う。例: https://~/purchase/search/New%20Items/Single%20Cards（カスタマイズ要件・機能仕様★の両方に明記）」。実装は「買取詳細検索のルートは #[Route(path: '/purchase/search', name: 'purchase_search', methods: ['GET'])] のみで、タグ・カテゴリを含む全条件をGETクエリパラメータ（purchaseFlg=1・tags 等）で受け渡す。パス変数を持つ /purchase/search/{tag}/{category} 相当のSEO用ルートは存在しない。CategorySidebarLinkContext::forPurchase() も listRoute…」。乖離理由は「設計★が要求するタグ・カテゴリのURLパス埋め込み（/tag/category 形式のSEO対策URL）が買取検索実装に存在しない。PurchaseController の全ルート(:139-1173, search は :399)、CategorySidebarLinkContext、purchase系ルーティング(PHP属性/yaml)を探索したが /purchase/search 配下にパス変数tag/categoryを持つルートは皆無で、Twigフォームも一律 url('purchase_search')…」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ルート・Controller",
    "Form・入力項目",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1366\n1363:       </section>\n1364:       <!-- function-design-embed:end f05-01-f05-01_front_online_purchase_buy_top -->\n1365: </section>\n1366:       <section class=\"sheet-panel\" id=\"sheet-4\">\n1367:         <div class=\"sheet-heading\">\n1368:           <h2>ネット買取商品検索</h2>\n1369:         </div>",
  "implementationRefs": [
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php:399",
    "src/Eccube/Service/App/Category/CategorySidebarLinkContext.php:42-50",
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php",
    "src/Eccube/Service/App/Category/CategorySidebarLinkContext.php"
  ],
  "implementationSnippets": [
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php:399\n396:      * @return array<string, mixed>\n397:      */\n398:     #[Route(path: '/purchase/search', name: 'purchase_search', methods: ['GET'])]\n399:     #[Template(template: 'Purchase/search.twig')]\n400:     public function search(Request $request): array\n401:     {\n402:         // 検索条件がなければフォームだけ返す",
    "src/Eccube/Service/App/Category/CategorySidebarLinkContext.php:42\n39:         return new self('product_list', 'product_category', [], ProductListOrderBy::COLOR);\n40:     }\n41: \n42:     public static function forPurchase(): self\n43:     {\n44:         return new self(\n45:             'purchase_search',",
    "src/Eccube/Controller/Front/Purchase/PurchaseController.php:65\n62: /**\n63:  * フロント買取画面\n64:  */\n65: class PurchaseController extends AbstractController\n66: {\n67:     /**\n68:      * 買取カートのセッションキー"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

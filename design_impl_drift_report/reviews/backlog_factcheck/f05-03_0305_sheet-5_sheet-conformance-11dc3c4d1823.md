# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json#f05-03_0305_sheet-5_sheet-conformance-11dc3c4d1823`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f05-03_0305_sheet-5_sheet.json`
- sourceFindingId: `f05-03_0305_sheet-5_sheet-conformance-11dc3c4d1823`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f05-03_0305_sheet-5_sheet` / F05-03 ネット買取商品一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 検索結果が0件のとき、一覧本文に『お探しのカードは見つかりませんでした』と、買取最低保証・ヘルプへの案内を含む文言を表示する。
- implementationActual: 0件時はクライアントJSの showEmptyResult が front.product.search__product_not_found=『お探しの商品は見つかりませんでした』の一文のみ描画する。買取最低保証・ヘルプ案内の文言/リンクは無く、文言も『カード』でなく『商品』。テンプレート全体に『最低保証』文字列は不在。
- mismatchReason: 設計のエラー・警告メッセージ表は0件案内に買取最低保証・ヘルプ案内を含めることを明記。空結果描画(showEmptyResult)とロケール(search__product_not_found)を確認したが単一メッセージのみで導線が欠落。表示文言の内容が設計と相違。
- designRefDetail: excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5（表示メッセージ『お探しのカードは見つかりませんでした。（買取最低保証・ヘルプへの案内を含む）』／エッジケース0件／エラー処理 検索結果0件）
- implRef: ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-purchase-unisearch-list-client.js:152-157（showEmptyResult）, src/Eccube/Resource/template/default/Purchase/search.twig:46, src/Eccube/Resource/locale/messages.ja.yaml:1096

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f05-03_0305_sheet-5_sheet-conformance-11dc3c4d1823",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5",
  "designRefDetail": "excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html#sheet-5（表示メッセージ『お探しのカードは見つかりませんでした。（買取最低保証・ヘルプへの案内を含む）』／エッジケース0件／エラー処理 検索結果0件）",
  "designExpectation": "検索結果が0件のとき、一覧本文に『お探しのカードは見つかりませんでした』と、買取最低保証・ヘルプへの案内を含む文言を表示する。",
  "designQuote": "検索結果が0件のとき、一覧本文に『お探しのカードは見つかりませんでした』と、買取最低保証・ヘルプへの案内を含む文言を表示する。",
  "implRef": "ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-purchase-unisearch-list-client.js:152-157（showEmptyResult）, src/Eccube/Resource/template/default/Purchase/search.twig:46, src/Eccube/Resource/locale/messages.ja.yaml:1096",
  "implementationActual": "0件時はクライアントJSの showEmptyResult が front.product.search__product_not_found=『お探しの商品は見つかりませんでした』の一文のみ描画する。買取最低保証・ヘルプ案内の文言/リンクは無く、文言も『カード』でなく『商品』。テンプレート全体に『最低保証』文字列は不在。",
  "difference": "設計のエラー・警告メッセージ表は0件案内に買取最低保証・ヘルプ案内を含めることを明記。空結果描画(showEmptyResult)とロケール(search__product_not_found)を確認したが単一メッセージのみで導線が欠落。表示文言の内容が設計と相違。",
  "mismatchReason": "設計のエラー・警告メッセージ表は0件案内に買取最低保証・ヘルプ案内を含めることを明記。空結果描画(showEmptyResult)とロケール(search__product_not_found)を確認したが単一メッセージのみで導線が欠落。表示文言の内容が設計と相違。",
  "comparisonRows": [
    {
      "item": "0件時の一覧本文文言",
      "design": "『お探しのカードは見つかりませんでした』＋買取最低保証・ヘルプ案内を含む",
      "implementation": "『お探しの商品は見つかりませんでした』の一文のみ",
      "mismatch": "文言（カード/商品）相違＋最低保証・ヘルプ案内が欠落"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f05-03_0305_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "ec-cube-enterprise/html/template/default/assets/hareruya/js/hareruya-purchase-unisearch-list-client.js:152-157（showEmptyResult）, src/Eccube/Resource/template/default/Purchase/search.twig:46, src/Eccube/Resource/locale/messages.ja.yaml:1096",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「検索結果が0件のとき、一覧本文に『お探しのカードは見つかりませんでした』と、買取最低保証・ヘルプへの案内を含む文言を表示する。」。実装は「0件時はクライアントJSの showEmptyResult が front.product.search__product_not_found=『お探しの商品は見つかりませんでした』の一文のみ描画する。買取最低保証・ヘルプ案内の文言/リンクは無く、文言も『カード』でなく『商品』。テンプレート全体に『最低保証』文字列は不在。」。乖離理由は「設計のエラー・警告メッセージ表は0件案内に買取最低保証・ヘルプ案内を含めることを明記。空結果描画(showEmptyResult)とロケール(search__product_not_found)を確認したが単一メッセージのみで導線が欠落。表示文言の内容が設計と相違。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "その他の明確な実装漏れ",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Twig・画面表示",
    "権限・セッション・副作用・エラー・ログ"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1628\n1625:       </section>\n1626:       <!-- function-design-embed:end f05-02-f05-02_front_online_purchase_buy_product_search -->\n1627: </section>\n1628:       <section class=\"sheet-panel\" id=\"sheet-5\">\n1629:         <div class=\"sheet-heading\">\n1630:           <h2>ネット買取商品一覧</h2>\n1631:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/template/default/Purchase/search.twig:46",
    "src/Eccube/Resource/locale/messages.ja.yaml:1096",
    "html/template/default/assets/hareruya/js/hareruya-purchase-unisearch-list-client.js:152-157",
    "src/Eccube/Resource/template/default/Purchase/search.twig",
    "src/Eccube/Resource/locale/messages.ja.yaml",
    "html/template/default/assets/hareruya/js/hareruya-purchase-unisearch-list-client.js"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/template/default/Purchase/search.twig:46\n43:         });\n44:     });\n45:     </script>\n46:     <script src=\"{{ asset('assets/hareruya/js/hareruya-products.js') }}\" defer></script>\n47:     {% endif %}\n48: {% endblock %}\n49: ",
    "src/Eccube/Resource/locale/messages.ja.yaml:1096\n1093: front.top.category.view_all: すべて見る\n1094: front.top.experience_banner.beginner_alt: プレイしながらMTGを覚えよう！初心者体験会 毎日無料開催\n1095: front.top.experience_banner.campaign_alt: MTGスタート応援キャンペーン MTG体験会参加で1,000円プレゼント！\n1096: front.top.recommend.title: おすすめ特集\n1097: \n1098: #------------------------------------------------------------------------------------\n1099: # 支店トップページ",
    "html/template/default/assets/hareruya/js/hareruya-purchase-unisearch-list-client.js:152\n149:             );\n150:         }\n151: \n152:         function showEmptyResult() {\n153:             $shelf().html(\n154:                 '<div class=\"ec-purchaseSearch__results-status\" style=\"grid-column:1/-1;text-align:center;padding:2rem;\">'\n155:                 + '<p class=\"ec-text ec-mb0\">' + cfg.emptyResultMsg + '</p></div>',"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

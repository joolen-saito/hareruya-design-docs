# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f03-01_0303_sheet-3_sheet.json#f03-01_0303_sheet-3_sheet-conformance-7f348cd40786`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f03-01_0303_sheet-3_sheet.json`
- sourceFindingId: `f03-01_0303_sheet-3_sheet-conformance-7f348cd40786`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f03-01_0303_sheet-3_sheet` / F03-01 商品一覧
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: 抽出件数が0件のとき、一覧領域に表示文言「ご指定の条件に一致する商品が見つかりませんでした。」を表示する
- implementationActual: 0件時に翻訳キー front.product.search__product_not_found を表示。その値は messages.ja.yaml:1096 で「お探しの商品は見つかりませんでした」。DB検索経路(list.twig:813 の {% else %}分岐)およびユニサーチ経路(product_list_unisearch_js.twig:22 emptyResultMsg → :114 numFound===0時に $shelf へ描画)の双方が同キーを使…
- mismatchReason: 設計指定文字列「ご指定の条件に一致する商品が見つかりませんでした。」は messages.ja.yaml・Twig・JS のいずれにも存在しない(grep 該当0件、同義文言はデッキ用 front.deck.result.empty_message:5749 にのみ存在)。実装は別文言「お探しの商品は見つかりませんでした」を出力しており、利用者が直接目にする0件時文言が設計と相違する。
- designRefDetail: excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-3 (表示メッセージ / エラー・警告(インライン) / 表示文言は表示メッセージ節を正とする)
- implRef: src/Eccube/Resource/locale/messages.ja.yaml:1096, src/Eccube/Resource/template/default/Product/list.twig:813, src/Eccube/Resource/template/default/Block/js/product_list_unisearch_js.twig:22,114

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f03-01_0303_sheet-3_sheet-conformance-7f348cd40786",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-3",
  "designRefDetail": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-3 (表示メッセージ / エラー・警告(インライン) / 表示文言は表示メッセージ節を正とする)",
  "designExpectation": "抽出件数が0件のとき、一覧領域に表示文言「ご指定の条件に一致する商品が見つかりませんでした。」を表示する",
  "designQuote": "抽出件数が0件のとき、一覧領域に表示文言「ご指定の条件に一致する商品が見つかりませんでした。」を表示する",
  "implRef": "src/Eccube/Resource/locale/messages.ja.yaml:1096, src/Eccube/Resource/template/default/Product/list.twig:813, src/Eccube/Resource/template/default/Block/js/product_list_unisearch_js.twig:22,114",
  "implementationActual": "0件時に翻訳キー front.product.search__product_not_found を表示。その値は messages.ja.yaml:1096 で「お探しの商品は見つかりませんでした」。DB検索経路(list.twig:813 の {% else %}分岐)およびユニサーチ経路(product_list_unisearch_js.twig:22 emptyResultMsg → :114 numFound===0時に $shelf へ描画)の双方が同キーを使用。",
  "difference": "設計指定文字列「ご指定の条件に一致する商品が見つかりませんでした。」は messages.ja.yaml・Twig・JS のいずれにも存在しない(grep 該当0件、同義文言はデッキ用 front.deck.result.empty_message:5749 にのみ存在)。実装は別文言「お探しの商品は見つかりませんでした」を出力しており、利用者が直接目にする0件時文言が設計と相違する。",
  "mismatchReason": "設計指定文字列「ご指定の条件に一致する商品が見つかりませんでした。」は messages.ja.yaml・Twig・JS のいずれにも存在しない(grep 該当0件、同義文言はデッキ用 front.deck.result.empty_message:5749 にのみ存在)。実装は別文言「お探しの商品は見つかりませんでした」を出力しており、利用者が直接目にする0件時文言が設計と相違する。",
  "comparisonRows": [
    {
      "item": "0件時の一覧領域表示文言",
      "design": "ご指定の条件に一致する商品が見つかりませんでした。",
      "implementation": "お探しの商品は見つかりませんでした (front.product.search__product_not_found)",
      "mismatch": "文言不一致（設計指定文字列は locale/Twig/JS に不在）"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f03-01_0303_sheet-3_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Resource/locale/messages.ja.yaml:1096, src/Eccube/Resource/template/default/Product/list.twig:813, src/Eccube/Resource/template/default/Block/js/product_list_unisearch_js.twig:22,114",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「抽出件数が0件のとき、一覧領域に表示文言「ご指定の条件に一致する商品が見つかりませんでした。」を表示する」。実装は「0件時に翻訳キー front.product.search__product_not_found を表示。その値は messages.ja.yaml:1096 で「お探しの商品は見つかりませんでした」。DB検索経路(list.twig:813 の {% else %}分岐)およびユニサーチ経路(product_list_unisearch_js.twig:22 emptyResultMsg → :114 numFound===0時に $shelf へ描画)の双方が同キーを使用。」。乖離理由は「設計指定文字列「ご指定の条件に一致する商品が見つかりませんでした。」は messages.ja.yaml・Twig・JS のいずれにも存在しない(grep 該当0件、同義文言はデッキ用 front.deck.result.empty_message:5749 にのみ存在)。実装は別文言「お探しの商品は見つかりませんでした」を出力しており、利用者が直接目にする0件時文言が設計と相違する。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "DB・保存/更新処理未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "ラベル・メッセージ・翻訳キー",
    "Repository・Entity・DB",
    "Twig・画面表示"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:846\n843:           </div>\n844:         </div>\n845:       </section>\n846:       <section class=\"sheet-panel\" id=\"sheet-3\">\n847:         <div class=\"sheet-heading\">\n848:           <h2>商品一覧</h2>\n849:         </div>",
  "implementationRefs": [
    "src/Eccube/Resource/locale/messages.ja.yaml:1096",
    "src/Eccube/Resource/template/default/Product/list.twig:813",
    "src/Eccube/Resource/template/default/Block/js/product_list_unisearch_js.twig:22,114",
    "src/Eccube/Resource/locale/messages.ja.yaml",
    "src/Eccube/Resource/template/default/Product/list.twig",
    "src/Eccube/Resource/template/default/Block/js/product_list_unisearch_js.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Resource/locale/messages.ja.yaml:1096\n1093: front.top.category.view_all: すべて見る\n1094: front.top.experience_banner.beginner_alt: プレイしながらMTGを覚えよう！初心者体験会 毎日無料開催\n1095: front.top.experience_banner.campaign_alt: MTGスタート応援キャンペーン MTG体験会参加で1,000円プレゼント！\n1096: front.top.recommend.title: おすすめ特集\n1097: \n1098: #------------------------------------------------------------------------------------\n1099: # 支店トップページ",
    "src/Eccube/Resource/template/default/Product/list.twig:813\n810: \n811:             {# Block/product_list_pickup.twig — ブロック管理「おすすめ商品から探す（商品一覧）」と同一ファイル #}\n812:             {% include 'Block/product_list_pickup.twig' %}\n813:             {# 最近チェックした商品 #}\n814:             {% include 'Block/recently_viewed.twig' %}\n815: \n816:             <div class=\"p-hareruya-product-list__banner\">",
    "src/Eccube/Resource/template/default/Block/js/product_list_unisearch_js.twig:22\n19:         pagerPrevAria: {{ 'common.pager.prev_aria'|trans|json_encode|raw }},\n20:         pagerNextAria: {{ 'common.pager.next_aria'|trans|json_encode|raw }},\n21:         pagerPageAria: {{ 'common.pager.page_aria'|trans({'%page%': '__PAGE__'})|json_encode|raw }},\n22:         emptyResultMsg: {{ 'front.product.search__product_not_found'|trans|json_encode|raw }}\n23:     };\n24: \n25:     const $shelf = $('#product-list-unisearch-shelf');"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

# Backlog Drift Fact-Check Review Pack

## Review Request
Critically review this single candidate. Do not trust the existing finding by itself.
Confirm or reject it only after checking the design HTML, ec-cube-enterprise source, and the relevant base implementation source.

## Candidate
- key: `hareruya-design-docs/design_impl_drift_report/findings/f03-03_0303_sheet-5_sheet.json#f03-03_0303_sheet-5_sheet-conformance-ab2423b16497`
- sourceFinding: `hareruya-design-docs/design_impl_drift_report/findings/f03-03_0303_sheet-5_sheet.json`
- sourceFindingId: `f03-03_0303_sheet-5_sheet-conformance-ab2423b16497`
- sourceRequirementId: ``
- candidateType: `finding`
- function: `f03-03_0303_sheet-5_sheet` / F03-03 商品詳細検索
- issueCategory: 実装漏れ
- dimension: ⑦要求網羅・実装違い

## Finding Fields
- designExpectation: カテゴリの選択肢は、フロント検索で非表示とする親配下（dtb_category.front_search_hide_flg=true の親カテゴリ配下）を除いて提示する。エッジケース『非表示親配下のカテゴリ→選択肢に出さない』を含め4箇所で明記。
- implementationActual: SearchType.php:95 が CategoryRepository::getList(null, true) の全カテゴリを SearchType.php:111 で choices にそのまま渡す。getList (CategoryRepository.php:140-144) は orderBy('c.sort_no','DESC') のみで front_search_hide_flg フィルタが無く、getSelfAndDescendants() で非表示親…
- mismatchReason: front_search_hide_flg を src/Eccube 配下で全走査した結果、使用箇所は TopCategoryListBuilder.php・CategoryTreeResponseBuilder.php・Category.php(定義)・CategoryType.php・CSV系のみで、フロント詳細検索のカテゴリ EntityType choices 生成経路(SearchType/getList/Twig)に非表示親配下除外ロジックが存在しない。実装は在…
- designRefDetail: excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-5
- implRef: src/Eccube/Form/Type/Front/SearchType.php:95,107-111 / src/Eccube/Repository/CategoryRepository.php:133-163 / src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:36-38

## Required Checks
- Open the cited design HTML and confirm the exact requirement is present and not Phase 2 / explicitly non-implemented.
- Search ec-cube-enterprise for route names, methods, labels, DB columns, constants, templates, JS, commands, CSV/PDF/API handlers, and nearby aliases.
- Search base repositories (`pf-api`, `pf-eccube3`, `pf-article`, `ec-cube`, `deck-api`, `deck-builder`) for the same behavior.
- If true, require exact code snippets for design, ec-cube-enterprise, and base implementation before creating a verified registry item.
- If false or weak, mark the queue item rejected or needs_review with the reason.

## Raw Finding JSON
```json
{
  "id": "f03-03_0303_sheet-5_sheet-conformance-ab2423b16497",
  "dimension": "⑦要求網羅・実装違い",
  "severity": "med",
  "designRef": "excel_to_html/output/0303_基本設計仕様書(フロント_商品).html#sheet-5",
  "designRefDetail": null,
  "designExpectation": "カテゴリの選択肢は、フロント検索で非表示とする親配下（dtb_category.front_search_hide_flg=true の親カテゴリ配下）を除いて提示する。エッジケース『非表示親配下のカテゴリ→選択肢に出さない』を含め4箇所で明記。",
  "designQuote": "カテゴリの選択肢は、フロント検索で非表示とする親配下（dtb_category.front_search_hide_flg=true の親カテゴリ配下）を除いて提示する。エッジケース『非表示親配下のカテゴリ→選択肢に出さない』を含め4箇所で明記。",
  "implRef": "src/Eccube/Form/Type/Front/SearchType.php:95,107-111 / src/Eccube/Repository/CategoryRepository.php:133-163 / src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:36-38",
  "implementationActual": "SearchType.php:95 が CategoryRepository::getList(null, true) の全カテゴリを SearchType.php:111 で choices にそのまま渡す。getList (CategoryRepository.php:140-144) は orderBy('c.sort_no','DESC') のみで front_search_hide_flg フィルタが無く、getSelfAndDescendants() で非表示親配下も全件返す。Twig(_product_search_form_fields.twig:36-38) も無条件ループ。front_search_hide_flg は検索フォーム経路で未使用。",
  "difference": "front_search_hide_flg を src/Eccube 配下で全走査した結果、使用箇所は TopCategoryListBuilder.php・CategoryTreeResponseBuilder.php・Category.php(定義)・CategoryType.php・CSV系のみで、フロント詳細検索のカテゴリ EntityType choices 生成経路(SearchType/getList/Twig)に非表示親配下除外ロジックが存在しない。実装は在るが設計の除外要件を満たさない。",
  "mismatchReason": "front_search_hide_flg を src/Eccube 配下で全走査した結果、使用箇所は TopCategoryListBuilder.php・CategoryTreeResponseBuilder.php・Category.php(定義)・CategoryType.php・CSV系のみで、フロント詳細検索のカテゴリ EntityType choices 生成経路(SearchType/getList/Twig)に非表示親配下除外ロジックが存在しない。実装は在るが設計の除外要件を満たさない。",
  "comparisonRows": [
    {
      "item": "カテゴリ選択肢の除外",
      "design": "front_search_hide_flg=true の親カテゴリ配下を選択肢から除外",
      "implementation": "getList(null,true) の全カテゴリを無条件に選択肢化（フラグ判定なし）",
      "mismatch": "非表示親配下のカテゴリも選択肢に出力される"
    }
  ],
  "verdict": "CONFIRMED",
  "confidence": "CONFIRMED",
  "source": "design_impl_conformance_audit",
  "functionId": "f03-03_0303_sheet-5_sheet",
  "impact": "設計書を正とした場合、画面操作・データ更新・外部連携・運用手順のいずれかで実装挙動が異なる。",
  "fixTarget": "src/Eccube/Form/Type/Front/SearchType.php:95,107-111 / src/Eccube/Repository/CategoryRepository.php:133-163 / src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:36-38",
  "comparisonSummary": "⑦要求網羅・実装違い：設計は「カテゴリの選択肢は、フロント検索で非表示とする親配下（dtb_category.front_search_hide_flg=true の親カテゴリ配下）を除いて提示する。エッジケース『非表示親配下のカテゴリ→選択肢に出さない』を含め4箇所で明記。」。実装は「SearchType.php:95 が CategoryRepository::getList(null, true) の全カテゴリを SearchType.php:111 で choices にそのまま渡す。getList (CategoryRepository.php:140-144) は orderBy('c.sort_no','DESC') のみで front_search_hide_flg フィルタが無く、getSelfAndDescendants() で非表示親配下も全件返す。Twig(_produc…」。乖離理由は「front_search_hide_flg を src/Eccube 配下で全走査した結果、使用箇所は TopCategoryListBuilder.php・CategoryTreeResponseBuilder.php・Category.php(定義)・CategoryType.php・CSV系のみで、フロント詳細検索のカテゴリ EntityType choices 生成経路(SearchType/getList/Twig)に非表示親配下除外ロジックが存在しない。実装は在るが設計の除外要件を満たさない。」。",
  "requiredChange": "設計書を正とするなら、修正対象の実装を設計の値・処理・列・応答・副作用に合わせる。",
  "implementationGap": true,
  "implementationGapType": "入出力・列定義・副作用未実装",
  "implementationGapLabel": "明確な実装漏れ",
  "auditAspects": [
    "Form・入力項目",
    "Repository・Entity・DB",
    "Twig・画面表示",
    "CSV・API・Batch・PDF・印刷"
  ],
  "designSnippet": "hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2155\n2152:       </section>\n2153:       <!-- function-design-embed:end f03-02-f03-02_front_product_product_detail -->\n2154: </section>\n2155:       <section class=\"sheet-panel\" id=\"sheet-5\">\n2156:         <div class=\"sheet-heading\">\n2157:           <h2>商品詳細検索</h2>\n2158:         </div>",
  "implementationRefs": [
    "src/Eccube/Form/Type/Front/SearchType.php:95,107",
    "src/Eccube/Repository/CategoryRepository.php:133-163",
    "src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:36-38",
    "src/Eccube/Form/Type/Front/SearchType.php",
    "src/Eccube/Repository/CategoryRepository.php",
    "src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig"
  ],
  "implementationSnippets": [
    "src/Eccube/Form/Type/Front/SearchType.php:95\n92:     {\n93:         $em = $this->registry->getManager($options['entity_manager']);\n94:         $locale = $this->requestStack->getCurrentRequest()?->getLocale() ?? 'ja';\n95:         $categories = $this->categoryRepository->getList(null, true);\n96: \n97:         $builder\n98:             ->add('product', TextType::class, [",
    "src/Eccube/Repository/CategoryRepository.php:133\n130:      */\n131:     public function getTreeByRootId(int $id): ?Category\n132:     {\n133:         $qb = $this->createQueryBuilder('c1')\n134:             ->select('c1, c2, c3, c4')\n135:             ->leftJoin('c1.Children', 'c2')\n136:             ->leftJoin('c2.Children', 'c3')",
    "src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:36\n33:                     <div class=\"c-hareruya-select\">\n34:                         <select name=\"{{ f.category.vars.full_name }}\" id=\"{{ f.category.vars.id }}\" aria-label=\"{{ 'form.category.label'|trans }}\">\n35:                             <option value=\"\">{{ 'form.category.empty_value'|trans }}</option>\n36:                             {% for choice in f.category.vars.choices %}\n37:                                 <option value=\"{{ choice.value }}\"{% if f.category.vars.data and f.category.vars.data.id == choice.value %} selected{% endif %}>{{ choice.label }}</option>\n38:                             {% endfor %}\n39:                         </select>"
  ],
  "auditChecklist": [
    "設計HTMLの該当節を確認",
    "Controller/Form/Service/Repository/Twig/CSV/API/Batch の候補実装を確認",
    "比較項目ごとに設計値・実装値・乖離理由を明文化",
    "実装者が修正対象を追えるよう、file:line とコード断片を添付"
  ]
}
```

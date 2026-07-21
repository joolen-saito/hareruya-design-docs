/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント商品
機能：商品詳細検索
課題カテゴリ：実装漏れ
課題：詳細検索のカテゴリ選択肢でフロント検索非表示親配下のカテゴリが除外されない
設計書：0303_基本設計仕様書(フロント_商品).xlsx

# 再現手順【必須】
1. 管理側データで、親カテゴリの dtb_category.front_search_hide_flg を true にし、その配下に子カテゴリを用意する
2. 商品詳細検索モーダルを表示する画面（例: http://localhost:8080/ja/products/search ）を開く
3. 詳細検索のカテゴリセレクトボックスに、フロント検索非表示親配下の子カテゴリが表示されるか確認する

# 期待される挙動【必須】
- カテゴリの選択肢は、フロント検索で非表示とする親カテゴリ配下を除いて提示する
- dtb_category.front_search_hide_flg は選択肢から除外する親配下の判定に用いる
- 非表示親配下のカテゴリは詳細検索フォームの選択肢に出さない

# 現在の挙動【必須】
- ec-cube-enterprise では SearchType が CategoryRepository::getList(null, true) の戻り値をそのまま category の choices に渡している。CategoryRepository::getList() は sort_no 降順で全カテゴリを取得するだけで front_search_hide_flg を条件にしておらず、テンプレートも f.category.vars.choices を無条件に option 出力する。

ec-cube-enterprise 詳細検索フォームのカテゴリchoices生成: `ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:91-115`
```php
    public function buildForm(FormBuilderInterface $builder, array $options): void
    {
        $em = $this->registry->getManager($options['entity_manager']);
        $locale = $this->requestStack->getCurrentRequest()?->getLocale() ?? 'ja';
        $categories = $this->categoryRepository->getList(null, true);

        $builder
            ->add('product', TextType::class, [
                'label' => 'form.product.label',
                'required' => false,
                'attr' => [
                    'maxlength' => 85,
                    'autocomplete' => 'off',
                    'placeholder' => 'form.product.empty_value',
                ],
            ])
            ->add('category', EntityType::class, [
                'label' => 'form.category.label',
                'required' => false,
                'class' => Category::class,
                'choices' => $categories,
                'choice_label' => fn (Category $category): string => $this->resolveCategoryChoiceLabel($category, $locale),
                'placeholder' => 'form.category.empty_value',
                'em' => $em,
            ])
```

ec-cube-enterprise CategoryRepository getList: `ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:133-150`
```php
    public function getList(?Category $Parent = null, bool $flat = false): array
    {
        // 全カテゴリを 1 クエリ(フラット)で取得し、親子ツリーは PHP 側で組み立てる。
        // 旧実装は c1..c5 の 5 階層自己 JOIN + 全件 SELECT で、カテゴリ件数の増加に伴い
        // 取得行数がデカルト積的に膨張し、ハイドレーションが極端に重くなっていた。
        // フラット取得 + Children コレクションの初期化済みハイドレーションにより、
        // 取得行数を O(カテゴリ数) に抑えつつ getChildren() の遅延ロード(N+1)も防ぐ。
        $allCategories = $this->createQueryBuilder('c')
            ->orderBy('c.sort_no', 'DESC')
            ->getQuery()
            ->setResultCacheLifetime($this->getCacheLifetime())
            ->getResult();

        ['roots' => $roots, 'childrenById' => $childrenById] = $this->buildCategoryTree($allCategories);

        if ($Parent !== null) {
            $Categories = $childrenById[$Parent->getId()] ?? [];
        } else {
```

ec-cube-enterprise front_search_hide_flg定義: `ec-cube-enterprise/src/Eccube/Entity/Category.php:456-484`
```php
        #[ORM\Column(name: 'front_search_hide_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => 'カテゴリ非表示フラグ'])]
        private bool $front_search_hide_flg = false;

        #[ORM\Column(name: 'branch_hide_flg', type: Types::BOOLEAN, options: ['default' => false, 'comment' => '支店非表示フラグ'])]
        private bool $branch_hide_flg = false;

        #[ORM\Column(name: 'banner_image', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'バナー画像'])]
        private ?string $banner_image = null;

        #[ORM\Column(name: 'icon_image', type: Types::STRING, length: 255, nullable: true, options: ['comment' => 'アイコン画像'])]
        private ?string $icon_image = null;

        #[ORM\Column(name: 'html_ja', type: Types::TEXT, nullable: true, options: ['comment' => '埋め込みHTML（日）'])]
        private ?string $html_ja = null;

        #[ORM\Column(name: 'html_en', type: Types::TEXT, nullable: true, options: ['comment' => '埋め込みHTML（英）'])]
        private ?string $html_en = null;

        #[ORM\Column(name: 'search_parameters', type: Types::TEXT, nullable: true, options: ['comment' => '検索パラメータ'])]
        private ?string $search_parameters = null;

        public function getFrontSearchHideFlg(): bool
        {
            return $this->front_search_hide_flg;
        }

        public function setFrontSearchHideFlg(bool $frontSearchHideFlg): Category
        {
            $this->front_search_hide_flg = $frontSearchHideFlg;
```

ec-cube-enterprise 詳細検索カテゴリoption出力: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:30-40`
```twig
            <legend class="p-hareruya-form-block__label-wrap"><span class="c-hareruya-heading--lev3">{{ 'form.category.label'|trans }}</span></legend>
            <div class="p-hareruya-form-block__form-list">
                <div class="p-hareruya-form-block__fields">
                    <div class="c-hareruya-select">
                        <select name="{{ f.category.vars.full_name }}" id="{{ f.category.vars.id }}" aria-label="{{ 'form.category.label'|trans }}">
                            <option value="">{{ 'form.category.empty_value'|trans }}</option>
                            {% for choice in f.category.vars.choices %}
                                <option value="{{ choice.value }}"{% if f.category.vars.data and f.category.vars.data.id == choice.value %} selected{% endif %}>{{ choice.label }}</option>
                            {% endfor %}
                        </select>
                        <i class="icon-hareruya-arrow-down c-hareruya-icon--xs" aria-hidden="true"></i>
```
- ベース実装 pf-eccube3 では、商品詳細検索フォームのカテゴリ候補を取得した後、親カテゴリの frontSearchHideFlg が true の場合に unset してから choices に渡している。したがって、同一機能のベース側に存在する非表示親配下除外処理が enterprise 側では抜けている。

ベース実装 pf-eccube3 カテゴリ選択肢の非表示親配下除外: `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:39-71`
```php
    public function buildForm(FormBuilderInterface $builder, array $options)
    {
        $app = $this->app;
        $productNameLength = $app['config']['HareruyaEc']['const']['product']['length']['name'];
        $nonFoil = $app['config']['HareruyaEc']['const']['cardDetail']['non_foil'];
        $foil = $app['config']['HareruyaEc']['const']['cardDetail']['foil'];
        $categoryList = $app['hareruya_ec.repository.category_sub']->getProperSortList()->getQuery()->getResult();
        
        foreach ($categoryList as $index => $category) {
            if (!is_null($category->getCategory()->getParent()) && $app['hareruya_ec.repository.category_sub']->findOneByCategoryId($category->getCategory()->getParent()->getId())->getFrontSearchHideFlg()) {
                unset($categoryList[$index]);
            }
        }

        $builder
            ->add('product', 'text', [
                'label' => $app->trans('form.product.label'),
                'required' => false,
                'attr' => [
                    'maxlength' => $productNameLength,
                    'autocomplete' => 'off',
                    'placeholder' => $app->trans('form.product.empty_value'),
                ],
            ])
            ->add('category', 'entity', [
                'label' => $app->trans('form.category.label'),
                'required' => false,
                'expanded' => false,
                'multiple' => false,
                'empty_value' => $app->trans('form.category.empty_value'),
                'choices' => $categoryList,
                'class' => 'Plugin\HareruyaEc\Entity\DtbCategorySub',
            ])
```

ベース実装 pf-eccube3 詳細検索カテゴリoption出力: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/search.twig:48-55`
```twig
                <p class="search_category_head">{{ searchForm.category.vars.label }}</p>
                <div class="right_box">
                    <select id="{{ searchForm.category.vars.id }}" name="{{ searchForm.category.vars.name }}" class="form-control">
                        <option value>{{ searchForm.category.vars.empty_value }}</option>
                    {% for key, choice in searchForm.category.vars.choices %}
                        <option value="{{ key }}" {% if query['category'] is defined and key == query['category'] %}selected{% endif %}>{% for i in 0..choice.data.level - 1 if not i == 0 %}&nbsp;&nbsp;{% endfor %}{{ choice.label }}</option>
                    {% endfor %}
                    </select>
```

# 根拠
- 設計：
  - 詳細検索フォームのカテゴリ除外判定: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2347`
  - 詳細検索フォームの処理手順と業務ルール: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2363-2368`
  - 入力項目とエッジケース: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2370-2373`
  - DBカラム: `hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書(フロント_商品).html:2386`
- ec-cube-enterprise：
  - 詳細検索カテゴリ候補に全カテゴリを渡す: `ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php:91-115`
  - getListはfront_search_hide_flgで絞り込まない: `ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php:133-150`
  - テンプレートはchoicesを無条件に出力する: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig:30-40`
- ベース実装：
  - 親カテゴリのfrontSearchHideFlgで候補をunsetしてからchoicesに渡す: `pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php:39-71`
  - ベース側テンプレートは除外済みchoicesを描画する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product/search.twig:48-55`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f03-03_0303_sheet-5_sheet.json#f03-03_0303_sheet-5_sheet-conformance-ab2423b16497'`
- 確認コマンド: `rg -n "非表示親|表示対象外の親|front_search_hide_flg|フロント非表示|選択肢に出さない|カテゴリ.*非表示|詳細検索フォーム|カテゴリ.*選択肢" hareruya-design-docs/design_impl_drift_report/findings/f03-03_0303_sheet-5_sheet.json hareruya-design-docs/excel_to_html/output/0303_基本設計仕様書\(フロント_商品\).html`
- 確認コマンド: `rg -n "front_search_hide_flg|getList\(|CategoryRepository|category_id|category|SearchType|product_search" ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Block/_product_search_form_fields.twig ec-cube-enterprise/src/Eccube/Entity/Category.php`
- 確認コマンド: `rg -n "front_product_search|category_id|category.*choices|ChoiceType|EntityType|getChildrenByParentId|getList\(" pf-eccube3/app/Plugin/HareruyaEc/Form pf-eccube3/app/Plugin/HareruyaEc/Controller/ProductController.php pf-eccube3/app/Plugin/HareruyaEc/Repository pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Product`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Form/Type/Front/SearchType.php | sed -n '91,115p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/CategoryRepository.php | sed -n '133,150p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Form/Type/Front/Product/SearchType.php | sed -n '39,71p'`
- gpt-5.5 high の批判的レビューは利用可能な外部レビュー環境がなく実行できなかったため、review-pack 生成とローカルの設計・base・enterprise ソース照合で確認した。

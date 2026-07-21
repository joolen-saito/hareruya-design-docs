/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロントネット買取
機能：ネット買取トップページ
課題カテゴリ：実装漏れ
課題：目玉買取商品の表示順に優先表示商品の商品コード順が適用されない
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. 管理画面の商品管理＞タグ登録で「目玉買取商品(ID:5)」タグに優先表示商品を商品コード順に設定する
2. 対象商品を本店公開・NM・買取価格1円以上の状態にして、http://localhost:8080/ja/purchase/ を表示する
3. 目玉買取商品コーナーの商品表示順が、タグ登録の優先表示商品に設定した商品コード順になっているか確認する

# 期待される挙動【必須】
- 目玉買取商品コーナーは「目玉買取商品(ID:5)」タグの商品を最大60件表示する
- 表示対象は本店公開、NM、買取価格1円以上の商品とする
- 商品表示順は、商品管理＞タグ登録で設定できる「優先表示商品」の商品コード順とする

# 現在の挙動【必須】
- ec-cube-enterprise の目玉買取商品ブロックは `tagged_unisearch_request(Tag::FEATURE_PURCHASE_ID, ..., true)` を使うが、`isBuy=true` のタグブロックでは `query['sort'] = 'release_date'` を固定設定している。UniSearch パラメータ生成側では `release_date desc,product desc,language asc,foil_flg asc` を送るため、`Tag::priorityProducts` に保持されている優先表示商品は表示順に使われない。

ec-cube-enterprise 目玉買取商品ブロック: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_feature_product.twig:1-8`
```twig
{# 買取TOP「目玉買取商品」: tagged UniSearch (tagId=目玉買取) #}

{% set tagUnisearch = tagged_unisearch_request(constant('Eccube\\Entity\\Tag::FEATURE_PURCHASE_ID'), purchaseUnisearchPageSize|default(60), true) %}

<section class="ec-purchaseTop__featureGoods">
    <h2 class="ec-purchaseTop__featureGoods__title">
        目玉買取商品
    </h2>
```

ec-cube-enterprise 買取タグブロックは発売日ソートを固定設定: `ec-cube-enterprise/src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:67-80`
```php
        $query = [
            'tags' => [(string) $tagId],
            'page' => UniSearchService::DEFAULT_PAGE,
            'pageSize' => $pageSize,
        ];
        if ($isBuy) {
            $query['sort'] = 'release_date';
        }

        return [
            'tagId' => $tagId,
            'query' => $query,
            'unisearchRequest' => $this->uniSearchService->createUnisearchParameter($query, $isBuy),
        ];
```

ec-cube-enterprise UniSearch は release_date desc を送信: `ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:316-329`
```php
        // ソート（recommended / default / 未設定は sort 行なし＝おすすめ相当。色順キーは applyProductListOrderByIdToUnisearchQuery と同一）
        $sortKey = $query['sort'] ?? null;
        if ($sortKey === self::QUERY_SORT_COLOR_SEQUENCE) {
            $params[] = 'sort='.urlencode('color_sequence asc,card_name asc,language asc,foil_flg asc,product asc');
        } elseif ($sortKey === 'price') {
            $order = !isset($query['order']) || !array_key_exists($query['order'], self::VALID_ORDERS) ? 'asc' : self::VALID_ORDERS[$query['order']];
            $params[] = 'sort='.urlencode('price '.$order.',color_sequence asc,card_name '.$order.',language asc,foil_flg asc');
        } elseif ($sortKey === 'release_date') {
            // query['order'] は参照しない（昇降は次行の固定文字列で表現済み）
            $params[] = 'sort='.urlencode('release_date desc,product desc,language asc,foil_flg asc');
        } elseif ($sortKey === self::QUERY_SORT_BUY_PRICE) {
            $order = !isset($query['order']) || !array_key_exists($query['order'], self::VALID_ORDERS) ? 'asc' : self::VALID_ORDERS[$query['order']];
            $params[] = 'sort='.urlencode('buy_price '.$order.',color_sequence asc,card_name asc,language asc,foil_flg asc');
        }
```

ec-cube-enterprise タグには優先表示商品カラムがある: `ec-cube-enterprise/src/Eccube/Entity/Tag.php:221-229`
```php
        #[ORM\Column(name: 'priority_products', type: Types::TEXT, nullable: true, options: ['comment' => '優先表示商品'])]
        private ?string $priorityProducts = null;

        public function setPriorityProducts(?string $priorityProducts): Tag
        {
            $this->priorityProducts = $priorityProducts;

            return $this;
        }
```
- ベース実装 pf-eccube3 では、買取トップが `Tag::FEATURE_PURCHASE_ID` を条件に `getProductsByTagsExceptHighPrice()` を呼び出し、同メソッド内で `addSortForPriority()` を実行する。`addSortForPriority()` はタグ登録の `priorityProducts` を行ごとに読み、商品コードの LIKE 条件に対応する CASE 式を組んで `priority ASC` で並べるため、優先表示商品の商品コード順が表示順に反映される。

ベース実装 pf-eccube3 買取トップの抽出条件: `pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:58-68`
```php
    public function index(Application $app)
    {
        $query = [
            'front_product_search' => null,
            'tags' => [Tag::FEATURE_PURCHASE_ID],
            'purchaseFlg' => true
        ];

        $result = $app['hareruya_ec.repository.product_sub_class']->getProductsByTagsExceptHighPrice($query, 'purchase_top_feature_products');

        return $app->render('Purchase/index.twig', [
```

ベース実装 pf-eccube3 買取トップ向け検索で優先表示商品対応を呼び出す: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:861-887`
```php
    public function getProductsByTagsExceptHighPrice($query, $cacheName)
    {
        $qb = $this->createQueryBuilder('psc');

        $qb->select(['psc', 'pc', 'ps', 'p', 'l', 'cco', 'cd', 'pst', 'tr', 'psci', 'pi'])
            ->innerJoin('psc.productClass', 'pc', Join::WITH, 'pc.price02 > 0')
            ->innerJoin('psc.productSub', 'ps')
            ->innerJoin('ps.product', 'p')
            ->innerJoin('p.ProductTag', 'pt', Join::WITH, $qb->expr()->in('pt.Tag', ':tags'))
            ->innerJoin('psc.language', 'l', Join::WITH, $qb->expr()->orX(
                $qb->expr()->eq('l.id', ':jpLanguageId'),
                $qb->expr()->eq('l.id', ':enLanguageId')
            ))
            ->innerJoin('psc.cardCondition', 'cco', Join::WITH, $qb->expr()->andX(
                $qb->expr()->eq('cco.code', ':condition'),
                $qb->expr()->isNull('psc.highPriceCode')
            ))
            ->leftJoin('psc.productSubClassImages', 'psci')
            ->leftJoin('psci.productImage', 'pi')
            ->leftJoin('ps.cardDetail', 'cd')
            ->leftJoin('cd.cardset', 'cs')
            ->leftJoin('pc.ProductStock', 'pst', Join::WITH, 'pst.ProductClass = pc')
            ->leftJoin('pc.TaxRule', 'tr', Join::WITH, 'tr.ProductClass = pc');

        // 優先表示商品対応
        $tags = $query['tags'];
        $priorityParameters = $this->addSortForPriority($qb, $tags);
```

ベース実装 pf-eccube3 priorityProducts から商品コード順の CASE ソートを組む: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1033-1060`
```php
    private function addSortForPriority($qb, $tags)
    {
        $priorityParameters = [];

        if (!$tagSub = $qb->getEntityManager()->getRepository('Plugin\HareruyaEc\Entity\MtbTagSub')->findOneByTagId($tags)) {
            return $priorityParameters;
        }

        $pattern = [];
        foreach ($qb->getEntityManager()->getRepository('Plugin\HareruyaEc\Entity\MtbCardCondition')->findAll() as $condition) {
            $pattern[] = "/{$condition->getCode()}$/";
        }

        $count = 0;
        $case = '(CASE ';
        foreach (explode("\r\n", $tagSub->getPriorityProducts()) as $row) {
            $row = preg_replace($pattern, '', trim($row));
            if ($row) {
                $priorityParameters["code{$count}"] = addcslashes($row, '%_') . '%';
                $qb->setParameters("code{$count}", addcslashes($row, '%_') . '%');
                $case = $case . "WHEN pc.code like :code{$count} THEN " . ++$count . ' ';
            }
        }

        if ($count) {
            $qb->addSelect($case . 'ELSE 99999 END) AS HIDDEN priority')
                ->orderBy('priority', 'ASC');
        }
```

# 根拠
- 設計：
  - 目玉買取商品の表示条件と優先表示商品の商品コード順: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:1183-1192`
- ec-cube-enterprise：
  - 目玉買取商品ブロックは買取タグ検索を使う: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_feature_product.twig:1-8`
  - 買取タグ検索はrelease_dateソート固定: `ec-cube-enterprise/src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php:67-80`
  - UniSearchへ発売日降順を送る: `ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php:316-329`
- ベース実装：
  - pf-eccube3では買取トップが目玉買取商品タグで検索する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php:58-68`
  - pf-eccube3では優先表示商品からpriorityソートを組む: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php:1033-1060`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f05-01_0305_sheet-3_sheet.json#f05-01_0305_sheet-3_sheet-conformance-34f0a3205b34'`
- 確認コマンド: `rg -n "目玉買取商品|優先表示商品|商品コード順|最大60|FEATURE_PURCHASE_ID|release_date|priorityProducts|getProductsByTagsExceptHighPrice|addSortForPriority" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html ec-cube-enterprise/src/Eccube pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '1180,1193p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Block/purchase_feature_product.twig | sed -n '1,30p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Twig/Extension/TaggedUnisearchRequestExtension.php | sed -n '55,85p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/UniSearch/UniSearchService.php | sed -n '305,330p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/PurchaseController.php | sed -n '58,68p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php | sed -n '861,887p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductSubClassRepository.php | sed -n '1033,1060p'`

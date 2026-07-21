/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチインフラ
機能：サイトマップ生成
課題カテゴリ：実装違い
課題：サイトマップをクローラーでファイル生成してS3へアップロードせず、HTTPリクエスト時にDBからXMLを返す
設計書：0416_基本設計仕様書(バッチ_インフラ).xlsx

# 再現手順【必須】
1. 設計書 B16-09 で、Sitemap-Generator-Crawlerを使い、晴れる屋トップページからリンクを辿ってURLリストを作成し、前回サイトマップとの差分がある場合にS3へアップロードするバッチ仕様であることを確認する
2. ベース実装 ec-cube の `SitemapController` を確認し、`/sitemap.xml` などのGETルートで、Page/Product/Category情報からTwig XMLレスポンスを返す実装であることを確認する
3. ec-cube-enterprise の `Front\SitemapController` を確認し、同じくGETルートでDB由来のXMLレスポンスを返しており、クローラー実行、サイトマップファイル作成、前回差分比較、S3アップロードがないことを確認する
4. ec-cube-enterprise / ec-cube を `Sitemap-Generator-Crawler`, `crawl(`, `Eventbridge`, `putObject`, `sitemap S3`, `前回`, `昨日` などで検索し、設計のバッチ処理本体が存在しないことを確認する

# 期待される挙動【必須】
- Sitemap-Generator-Crawlerを使い、晴れる屋トップページからリンクを辿ってアクセス可能なURLを抽出する
- 抽出したURLリストからサイトマップファイルを作成する
- 管理ページ、商品検索ページ、カードリスト購入ページ、デッキ検索ページ、イベント情報配下をクロール対象外にする
- 前回(昨日)のサイトマップと今回作成したサイトマップを比較し、差異がある場合にS3へアップロードする
- EventBridge + Lambda から毎日4:00に起動するバッチとして実行する

# 現在の挙動【必須】
- ec-cube-enterprise のサイトマップ実装は、`/sitemap.xml` などのHTTP GETルートを持つ `Front\SitemapController` である。`index()` はPage/Product/Category/Purchase/Deck情報を取得し、`outputXml()` でTwigテンプレートをレンダリングしてXMLレスポンスを返す。クローラーでURLを巡回してファイルを生成する処理、前回ファイルとの比較、S3アップロードはこのControllerにはない。

ec-cube-enterprise は /sitemap.xml のHTTPレスポンスとしてサイトマップを返す: `ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:53-115`
```php
    /**
     * Output sitemap index
     */
    #[Route(path: '/sitemap.xml', name: 'sitemap_xml', methods: ['GET'])]
    public function index(PaginatorInterface $paginator): Response
    {
        $pageQueryBuilder = $this->pageRepository->createQueryBuilder('p');
        $Page = $pageQueryBuilder->select('p')
            ->where("((p.meta_robots not like '%noindex%' and p.meta_robots not like '%none%') or p.meta_robots IS NULL)")
            ->andWhere('p.id <> 0')
            ->andWhere('p.MasterPage is null')
            ->orderBy('p.update_date', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getSingleResult();

        $Product = $this->productRepository->findOneBy(['Status' => 1], ['update_date' => 'DESC']);

        // フロントの商品一覧の条件で商品情報を取得
        $ProductListOrder = $this->productListOrderByRepository->find($this->eccubeConfig['eccube_product_order_newer']);
        $productQueryBuilder = $this->productRepository->getQueryBuilderBySearchData(['orderby' => $ProductListOrder]);
        /** @var SlidingPagination<int, Product> $pagination */
        $pagination = $paginator->paginate(
            $productQueryBuilder,
            1,
            $this->eccubeConfig['eccube_sitemap_products_per_page']
        );
        $paginationData = $pagination->getPaginationData();

        $Category = $this->categoryRepository->findOneBy([], ['update_date' => 'DESC']);

        $PurchaseProduct = $this->productRepository->getLatestProductForPurchaseSitemap();
        /** @var SlidingPagination<int, Product> $purchasePagination */
        $purchasePagination = $paginator->paginate(
            $this->productRepository->getPurchaseSitemapQueryBuilder(),
            1,
            $this->eccubeConfig['eccube_sitemap_products_per_page']
        );

        $Deck = $this->dtbDeckRepository->findOneBy([], ['updateDate' => 'DESC']);

        $LatestDeckShow = $this->dtbDeckRepository->getLatestDeckForShowSitemap();
        /** @var SlidingPagination<int, \Eccube\Entity\DtbDeck> $deckShowPagination */
        $deckShowPagination = $paginator->paginate(
            $this->dtbDeckRepository->getDeckShowSitemapQueryBuilder(),
            1,
            $this->eccubeConfig['eccube_sitemap_products_per_page']
        );

        return $this->outputXml(
            [
                'Category' => $Category,
                'Product' => $Product,
                'productPageCount' => $paginationData['pageCount'],
                'Page' => $Page,
                'PurchaseProduct' => $PurchaseProduct,
                'purchasePageCount' => $purchasePagination->getPaginationData()['pageCount'],
                'Deck' => $Deck,
                'LatestDeckShow' => $LatestDeckShow,
                'deckShowPageCount' => $deckShowPagination->getPaginationData()['pageCount'],
            ],
            'sitemap_index.xml.twig'
        );
```

ec-cube-enterprise の outputXml はファイル保存ではなくTwig XMLレスポンスを返す: `ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:244-259`
```php
    /**
     * Output XML response by data.
     *
     * @param array<string, mixed> $data
     */
    private function outputXml(array $data, string $template_name = 'sitemap.xml.twig'): Response
    {
        $response = new Response();
        $response->headers->set('Content-Type', 'application/xml'); // Content-Typeを設定

        return $this->render(
            $template_name,
            $data,
            $response
        );
    }
```
- ベース実装 ec-cube も同じ方向の実装で、`/sitemap.xml` GETルートからPage/Product/Category情報を取得し、`outputXml()` でXMLレスポンスを返す。設計で前提にしているSitemap-Generator-Crawlerによる巡回バッチやS3アップロード実装ではない。

ベース実装 ec-cube も /sitemap.xml のHTTPレスポンスとしてサイトマップを返す: `ec-cube/src/Eccube/Controller/SitemapController.php:82-122`
```php
    /**
     * Output sitemap index
     *
     * @Route("/sitemap.xml", name="sitemap_xml", methods={"GET"})
     */
    public function index(PaginatorInterface $paginator)
    {
        $pageQueryBuilder = $this->pageRepository->createQueryBuilder('p');
        $Page = $pageQueryBuilder->select('p')
            ->where("((p.meta_robots not like '%noindex%' and p.meta_robots not like '%none%') or p.meta_robots IS NULL)")
            ->andWhere('p.id <> 0')
            ->andWhere('p.MasterPage is null')
            ->orderBy('p.update_date', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getSingleResult();

        $Product = $this->productRepository->findOneBy(['Status' => 1], ['update_date' => 'DESC']);

        // フロントの商品一覧の条件で商品情報を取得
        $ProductListOrder = $this->productListOrderByRepository->find($this->eccubeConfig['eccube_product_order_newer']);
        $productQueryBuilder = $this->productRepository->getQueryBuilderBySearchData(['orderby' => $ProductListOrder]);
        /** @var SlidingPagination $pagination */
        $pagination = $paginator->paginate(
            $productQueryBuilder,
            1,
            $this->eccubeConfig['eccube_sitemap_products_per_page']
        );
        $paginationData = $pagination->getPaginationData();

        $Category = $this->categoryRepository->findOneBy([], ['update_date' => 'DESC']);

        return $this->outputXml(
            [
                'Category' => $Category,
                'Product' => $Product,
                'productPageCount' => $paginationData['pageCount'],
                'Page' => $Page,
            ],
            'sitemap_index.xml.twig'
        );
```

ベース実装 ec-cube の outputXml もTwig XMLレスポンスを返す: `ec-cube/src/Eccube/Controller/SitemapController.php:207-225`
```php
    /**
     * Output XML response by data.
     *
     * @param array $data
     * @param string $template_name
     *
     * @return Response
     */
    private function outputXml(array $data, $template_name = 'sitemap.xml.twig')
    {
        $response = new Response();
        $response->headers->set('Content-Type', 'application/xml'); // Content-Typeを設定

        return $this->render(
            $template_name,
            $data,
            $response
        );
    }
```

# 根拠
- 設計：
  - B16-09はクローラーによるURL巡回、ファイル作成、前回比較、S3アップロードを要求している: `hareruya-design-docs/excel_to_html/output/0416_基本設計仕様書(バッチ_インフラ).html:1288-1326`
- ec-cube-enterprise：
  - enterpriseはHTTP ControllerでXMLを返す実装であり、ファイル生成/S3アップロードではない: `ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php:56-115`
- ベース実装：
  - ベースec-cubeもHTTP ControllerでXMLを返す実装であり、クローラーバッチではない: `ec-cube/src/Eccube/Controller/SitemapController.php:82-122`

# 確認メモ
- 確認コマンド: `rg -n "Sitemap-Generator-Crawler|晴れる屋トップページ|前回\(昨日\)|Eventbridge|Lamdba|出力先\(フォーマット\).*S3" excel_to_html/output/0416_基本設計仕様書\(バッチ_インフラ\).html design_impl_drift_report/findings/b16-09_0416_sheet-11_sheet.json`
- 確認コマンド: `rg -n "Sitemap-Generator-Crawler|SitemapGenerator|crawl\(|Eventbridge|Lambda|s3 cp|s3 sync|putObject|sitemap.*S3|前回|昨日" ../ec-cube-enterprise ../ec-cube --glob '!vendor/**' --glob '!node_modules/**' --glob '!var/cache/**'`
- 確認コマンド: `rg -n "sitemap.xml|sitemap_index.xml.twig|outputXml|sitemap_product|sitemap_page" ../ec-cube-enterprise/src/Eccube/Controller/Front/SitemapController.php ../ec-cube/src/Eccube/Controller/SitemapController.php`

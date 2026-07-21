/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API商品管理
機能：ポップアップ用商品情報取得（旧商品ID）
課題カテゴリ：実装漏れ
課題：旧商品IDのポップアップ用商品情報取得でレスポンスに cardId が返らない
設計書：0502_基本設計仕様書(API_商品管理).xlsx

# 再現手順【必須】
1. カードマスタの old_product_id または old_en_product_id に紐づく旧商品IDを用意する
2. GET http://localhost:8080/popup/old/{oldProductId} を実行する
3. HTTP 200 の JSON レスポンスに cardId が含まれるか確認する

# 期待される挙動【必須】
- 旧商品IDに対応するポップアップ用商品情報を JSON で返す
- 成功レスポンスには productId, name, productClassId, price01, price02, stock, nameEn, fileName, cardId を含める
- cardId はカードマスタ mtb_card.id の値を返す

# 現在の挙動【必須】
- ec-cube-enterprise では、/popup/old/{oldProductId} の controller が findPopupProductByOldProductIdWithoutLang() の結果を PopupResponseBuilder::build(..., true) に渡しているが、builder のレスポンス定義に cardId がない。repository も mtb_card c に JOIN しているものの SELECT と ResultSetMapping に c.id AS cardId がなく、cardId を builder へ渡せない。

ec-cube-enterprise controller は旧商品ID取得結果を共通 builder へ渡す: `ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:317-334`
```php
    #[Route(path: '/popup/old/{oldProductId}', name: 'popup_card_by_old_product_id', requirements: ['oldProductId' => '[^./]+'], methods: ['GET'])]
    #[Route(path: '/popup/old/{oldProductId}.json', name: 'popup_card_by_old_product_id_json', requirements: ['oldProductId' => '[^./]+'], methods: ['GET'])]
    public function getPopupCardByOldProductId(string $oldProductId): JsonResponse
    {
        try {
            $result = $this->productRepository->findPopupProductByOldProductIdWithoutLang($oldProductId);
            if ($result === null) {
                throw new NotFoundException('Not Found');
            }

            $locale = $result['languageCode'] === 'EN' ? 'en' : 'ja';
            $productUrl = $this->generateUrl(
                'product_detail',
                ['id' => (int) $result['productId'], '_locale' => $locale],
                UrlGeneratorInterface::ABSOLUTE_URL
            );

            return $this->json($this->popupResponseBuilder->build($result, $productUrl, true), Response::HTTP_OK);
```

ec-cube-enterprise response builder は cardId を返さない: `ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:27-51`
```php
    public function build(array $result, string $productUrl, bool $includeBeltUrl = false): array
    {
        $response = [
            'productId' => $result['productId'],
            'name' => $result['productName'],
            'productClassId' => $result['productClassId'],
            'price01' => $result['price01'],
            'price02' => $result['price02'],
            'stock' => (int) ($result['stock'] ?? 0),
            'nameEn' => $result['nameEn'],
            'subFileName' => $result['imageFileName'],
            'fileName' => $result['imageFileName'],
            'code' => $result['languageCode'],
            'conditionCode' => $result['conditionCode'],
            'weeklySold' => (int) ($result['weeklySold'] ?? 0),
            'productUrl' => $productUrl,
        ];

        if ($includeBeltUrl) {
            $response['beltUrl'] = $result['beltUrl'] ?? null;
        } else {
            $response['foilFlg'] = $result['foilFlg'];
        }

        return $response;
```

ec-cube-enterprise repository は mtb_card に JOIN するが cardId を SELECT/RSM しない: `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2381-2440`
```php
    public function findPopupProductByOldProductIdWithoutLang(string $oldProductId): ?array
    {
        $sql = <<<SQL
SELECT
    p.id AS productId,
    p.name AS productName,
    p.name_en AS nameEn,
    pc.id AS productClassId,
    pc.price01 AS price01,
    pc.price02 AS price02,
    pc.stock AS stock,
    COALESCE(lang.code, CASE WHEN c.old_product_id = :oldProductId THEN 'JP' ELSE 'EN' END) AS languageCode,
    CASE WHEN pc.memo IS NOT NULL AND pc.memo != '' THEN pc.memo ELSE cc.code END AS conditionCode,
    pc.belt_url AS beltUrl,
    pimg.file_name AS imageFileName,
    (SELECT COALESCE(SUM(pc2.order_quantity_04), 0)
     FROM dtb_product_class pc2
     LEFT JOIN mtb_language lang2 ON pc2.language_id = lang2.id
     WHERE pc2.product_id = p.id
       AND pc2.visible = true
       AND lang2.code = CASE WHEN c.old_product_id = :oldProductId THEN 'JP' ELSE 'EN' END) AS weeklySold
FROM dtb_product p
    INNER JOIN dtb_product_class pc ON p.id = pc.product_id AND pc.visible = true
    LEFT JOIN mtb_language lang ON pc.language_id = lang.id
    LEFT JOIN mtb_card_condition cc ON pc.card_condition_id = cc.id
    LEFT JOIN dtb_product_class_image pci ON pci.product_class_id = pc.id
    LEFT JOIN dtb_product_image pimg ON pci.product_image_id = pimg.id
    INNER JOIN mtb_card_detail cd ON p.card_detail_id = cd.id
    INNER JOIN mtb_card c ON cd.card_id = c.id
    LEFT JOIN mtb_cardset cs ON cd.cardset_id = cs.id
WHERE (c.old_product_id = :oldProductId OR c.old_en_product_id = :oldProductId)
  AND p.product_status_id = :statusId
ORDER BY
    CASE WHEN cs.special_flg THEN 1 ELSE 2 END ASC,
    CASE WHEN cd.promotion_flg THEN 1 ELSE 2 END ASC,
    COALESCE(cs.release_date, '1900-01-01'::timestamptz) DESC,
    cd.foil_flg ASC,
    CASE WHEN lang.code = CASE WHEN c.old_product_id = :oldProductId THEN 'JP' ELSE 'EN' END THEN 1 ELSE 2 END ASC,
    CASE WHEN pci.rank = CASE WHEN c.old_product_id = :oldProductId THEN 2 ELSE 1 END THEN 1 ELSE 2 END ASC
LIMIT 1
SQL;

        $rsm = new ResultSetMapping();
        $rsm->addScalarResult('productid', 'productId', 'integer');
        $rsm->addScalarResult('productname', 'productName', 'string');
        $rsm->addScalarResult('nameen', 'nameEn', 'string');
        $rsm->addScalarResult('productclassid', 'productClassId', 'integer');
        $rsm->addScalarResult('price01', 'price01', 'integer');
        $rsm->addScalarResult('price02', 'price02', 'integer');
        $rsm->addScalarResult('stock', 'stock', 'integer');
        $rsm->addScalarResult('languagecode', 'languageCode', 'string');
        $rsm->addScalarResult('conditioncode', 'conditionCode', 'string');
        $rsm->addScalarResult('belturl', 'beltUrl', 'string');
        $rsm->addScalarResult('imagefilename', 'imageFileName', 'string');
        $rsm->addScalarResult('weeklysold', 'weeklySold', 'integer');

        $query = $this->getEntityManager()->createNativeQuery($sql, $rsm);
        $query->setParameter('oldProductId', $oldProductId);
        $query->setParameter('statusId', ProductStatus::DISPLAY_SHOW);
```
- ベース実装(pf-api)では、/popup/old/{oldProductId} が ProductController::getPopupProductOldAction に割り当てられ、DtbProductRepository::findPopupProductByOldProductId() の SELECT で card.id AS cardId を返している。

ベース実装 pf-api route は /popup/old/{oldProductId} を controller に割り当てる: `pf-api/config/routes.yaml:93-100`
```yaml
get_popup_product_old_json:
    path: /popup/old/{oldProductId}.json
    controller: App\Controller\ProductController::getPopupProductOldAction
    methods: GET
get_popup_product_old:
    path: /popup/old/{oldProductId}
    controller: App\Controller\ProductController::getPopupProductOldAction
    methods: GET
```

ベース実装 pf-api controller は repository 結果をそのまま返す: `pf-api/src/Controller/ProductController.php:113-128`
```php
    public function getPopupProductOldAction($oldProductId)
    {
        $product = $this->getDoctrine()
            ->getRepository(DtbProduct::class)
            ->findPopupProductByOldProductId($oldProductId);

        if (empty($product)) {
            $view = View::create([
                "code" => 404,
                "message" => 'Not Found'
            ], 404);

            return $this->get('fos_rest.view_handler')->handle($view);
        }

        return $product;
```

ベース実装 pf-api repository は card.id AS cardId を SELECT する: `pf-api/src/Repository/DtbProductRepository.php:88-115`
```php
    public function findPopupProductByOldProductId($oldProductId)
    {
        //先頭のProductClassとProductImageを取得。表示方法によって取ってくる条件は要検討
        $result = $this->createQueryBuilder('product')
            ->join('product.productSub', 'productSub')
            ->join('product.productClasses', 'productClass')
            ->join('product.productImages', 'productImage')
            ->join('productSub.cardDetail', 'cardDetail')
            ->join('cardDetail.card', 'card')
            ->where('(card.oldProductId = :oldProductId or card.oldEnProductId = :oldProductId)')
            ->andWhere('product.delFlg = 0')
            ->andWhere('productClass.delFlg = 0')
            ->setParameter('oldProductId', $oldProductId)
            ->select('
                product.productId,
                product.name,
                productClass.productClassId,
                productClass.price01,
                productClass.price02,
                productClass.stock,
                productClass.productClassId,
                productSub.nameEn,
                productImage.fileName,
                card.id AS cardId
            ')
            ->getQuery()
            ->setMaxResults(1)
            ->getOneOrNullResult();
```

# 根拠
- 設計：
  - A02-03 は pf-api を確認値とし、旧商品IDを用いる言語指定なしエンドポイントを扱う: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1346-1348`
  - cardId は mtb_card.id を返す: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1358-1361`
  - 成功レスポンスに cardId を含める: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1377-1394`
  - DBカラム定義で mtb_card.id を応答の cardId に使用すると定義: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1402-1404`
- ec-cube-enterprise：
  - controller は repository 結果を builder に渡す: `ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:317-334`
  - builder のレスポンス定義に cardId がない: `ec-cube-enterprise/src/Eccube/Service/App/Popup/PopupResponseBuilder.php:27-51`
  - repository は旧商品IDで mtb_card に JOIN するが cardId を SELECT/RSM しない: `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2381-2440`
- ベース実装：
  - route は /popup/old/{oldProductId} を ProductController に割り当てる: `pf-api/config/routes.yaml:93-100`
  - controller は repository 取得結果を返す: `pf-api/src/Controller/ProductController.php:113-128`
  - repository は card.id AS cardId を返す: `pf-api/src/Repository/DtbProductRepository.php:88-115`

# 確認メモ
- 確認コマンド: `rg -n "A02-03|ポップアップ用商品情報取得|旧商品ID|oldProductId|cardId|mtb_card|レスポンス|productId|fileName" hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html`
- 確認コマンド: `rg -n "popup/product|oldProductId|findPopupProductByOldProductId|cardId|card_id|build\(|PopupResponse|popupResponse" ec-cube-enterprise/src/Eccube pf-api/src pf-api/config`
- 確認コマンド: `rg -n "cardId|card_id|findPopupProductByOldProductIdWithoutLang|popup_card_by_old_product_id|PopupResponseBuilder|beltUrl|productUrl" ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php ec-cube-enterprise/src/Eccube/Service/App/Popup ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php`
- 確認コマンド: `rg -n "findPopupProductByOldProductId\(|card.id AS cardId|getPopupProductOldAction|/popup/old/\{oldProductId\}" pf-api/src pf-api/config`
- 設計HTMLは A02-03 の確認値を pf-api とし、成功レスポンスの cardId を mtb_card.id 由来と定義している。
- pf-api は /popup/old/{oldProductId} の repository で card.id AS cardId を SELECT し、controller がその結果を返している。
- ec-cube-enterprise は同 endpoint の repository で mtb_card に JOIN しているが cardId を SELECT/RSM せず、PopupResponseBuilder も cardId をレスポンスに含めていない。

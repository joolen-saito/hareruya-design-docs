/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API商品管理
機能：ポップアップ用カード情報取得
課題カテゴリ：実装漏れ
課題：ポップアップ用カード情報取得で foil_flg と price クエリが取得条件・並び順に反映されない
設計書：0502_基本設計仕様書(API_商品管理).xlsx

# 再現手順【必須】
1. カードIDに紐づく通常版・フォイル版、または販売価格の異なる商品規格が存在する状態で、GET http://localhost:8080/api/popup/card/ja/{cardId}?foil_flg=1&price=high を実行する
2. 同じ cardId に対して GET http://localhost:8080/api/popup/card/ja/{cardId}?foil_flg=0&price=low を実行する
3. 返却される商品規格が foil_flg と price の指定に応じて切り替わるか、または並び優先が変わるかを確認する

# 期待される挙動【必須】
- パスの cardId と lang に加えて、クエリの foil_flg と price を受け取る
- foil_flg 指定時はフォイル区分の並び順に反映する。真値は降順、偽値は昇順、未指定時は非フォイル優先で並べる
- price=high の場合は販売価格 price02 の降順、それ以外の値では昇順に並べる。未指定時は価格での並びを行わない

# 現在の挙動【必須】
- ec-cube-enterprise では、A02-02 の controller が Request を受け取らず、cardId/lang だけを ProductRepository::findPopupProductByCardId($cardId, $languageCode) に渡している。repository も引数が cardId と languageCode のみで、SQL は cd.foil_flg ASC 固定、price02 の昇降順切替はない。

ec-cube-enterprise controller は Request/query を受け取らない: `ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265-278`
```php
    #[Route(path: '/api/popup/card/{lang}/{cardId}', name: 'popup_product_by_card_id', methods: ['GET'])]
    public function getPopupProductByCardId(string $lang, string $cardId): JsonResponse
    {
        try {
            if (!preg_match('/^\\d+$/', $cardId) || (int) $cardId < 1) {
                throw new NotFoundException('Not Found');
            }

            $languageCode = match (strtolower($lang)) {
                'ja' => 'JP',
                default => 'EN',
            };

            $result = $this->productRepository->findPopupProductByCardId((int) $cardId, $languageCode);
```

ec-cube-enterprise repository は cardId/languageCode のみで固定ソート: `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2226-2291`
```php
    public function findPopupProductByCardId(int $cardId, string $languageCode): ?array
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
    COALESCE(lang.code, :languageCode) AS languageCode,
    CASE WHEN pc.memo IS NOT NULL AND pc.memo != '' THEN pc.memo ELSE cc.code END AS conditionCode,
    pc.belt_url AS beltUrl,
    pimg.file_name AS imageFileName,
    (SELECT COALESCE(SUM(pc2.order_quantity_04), 0)
     FROM dtb_product_class pc2
     LEFT JOIN mtb_language lang2 ON pc2.language_id = lang2.id
     WHERE pc2.product_id = p.id
       AND pc2.visible = true
       AND lang2.code = :languageCode) AS weeklySold
FROM dtb_product p
    INNER JOIN dtb_product_class pc ON p.id = pc.product_id AND pc.visible = true
    LEFT JOIN mtb_language lang ON pc.language_id = lang.id
    LEFT JOIN mtb_card_condition cc ON pc.card_condition_id = cc.id
    LEFT JOIN dtb_product_class_image pci ON pci.product_class_id = pc.id
    LEFT JOIN dtb_product_image pimg ON pci.product_image_id = pimg.id
    INNER JOIN mtb_card_detail cd ON p.card_detail_id = cd.id
    INNER JOIN mtb_card c ON cd.card_id = c.id
    LEFT JOIN mtb_cardset cs ON cd.cardset_id = cs.id
WHERE c.id = :cardId
  AND p.product_status_id = :statusId
ORDER BY
    c.id ASC,
    CASE WHEN cs.special_flg THEN 1 ELSE 2 END ASC,
    CASE WHEN cd.promotion_flg THEN 1 ELSE 2 END ASC,
    cs.release_date DESC NULLS LAST,
    cd.foil_flg ASC,
    CASE WHEN pc.stock > 0 THEN 1 ELSE 2 END ASC,
    CASE WHEN lang.code = :languageCode THEN 1 ELSE 2 END ASC,
    pc.card_condition_id ASC NULLS LAST,
    pci.rank ASC NULLS LAST,
    CASE WHEN pimg.file_name IS NOT NULL THEN 1 ELSE 2 END ASC
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
        $query->setParameter('cardId', $cardId);
        $query->setParameter('languageCode', $languageCode);
        $query->setParameter('statusId', ProductStatus::DISPLAY_SHOW);

        return $query->getOneOrNullResult();
```
- ベース実装(pf-api)では、同じポップアップ用カード情報取得で Request から foil_flg と price を取得し、DtbProductSubClassRepository::findPopupProductByCardIdAndLang($cardId, $lang, $foilFlg, $price) に渡す。repository 側では foil_flg 指定時に cardDetail.foilFlg の昇降順を切り替え、price 指定時に productClass.price02 の昇降順を切り替えている。

ベース実装 pf-api controller は foil_flg/price を取得して repository へ渡す: `pf-api/src/Controller/ProductController.php:87-93`
```php
    public function getPopupCardProductAction(Request $request, $lang, $cardId)
    {
        $foilFlg = $request->get('foil_flg');
        $price = $request->get('price');
        $product = $this->getDoctrine()
            ->getRepository(DtbProductSubClass::class)
            ->findPopupProductByCardIdAndLang($cardId, $lang, $foilFlg, $price);
```

ベース実装 pf-api repository は foil_flg/price で並び順を切り替える: `pf-api/src/Repository/DtbProductSubClassRepository.php:91-122`
```php
    public function findPopupProductByCardIdAndLang($cardId, $lang, $foilFlg, $price)
    {
        //1. 非フォイル優先 2. 非プロモ優先 3. 指定された言語優先 4. 日本語優先 5. カードセットのリリース日が新しいもの優先
        $qb = $this->createQueryBuilder('productSubClass')
            ->join('productSubClass.product', 'product')
            ->join('productSubClass.productClass', 'productClass')
            ->join('productSubClass.cardCondition', 'cardCondition')
            ->join('product.productSub', 'productSub')
            ->join('productSubClass.language', 'language')
            ->join('productSub.cardDetail', 'cardDetail')
            ->join('cardDetail.card', 'card')
            ->join('cardDetail.cardset', 'cardset')
            ->leftJoin('productSubClass.productSubClassImages', 'productSubClassImage')
            ->leftJoin('product.productImages', 'productImage')
            ->leftJoin('productSubClassImage.productImage', 'productSubImage', 'with', 'productSubImage.fileName IS NULL OR (productSubImage.fileName = productImage.fileName)')
            ->where('card.id = :cardId')
            ->andWhere('product.delFlg = 0')
            ->andWhere('productClass.delFlg = 0')
            ->andWhere('product.status = 1')
            ->orderBy('card.id', 'ASC');
        if (!is_null($foilFlg)) {
            $qb->addOrderBy('cardDetail.foilFlg', $foilFlg ? 'DESC' : 'ASC');
        }
        if (!is_null($price)) {
            $qb->addOrderBy('productClass.price02', $price === 'high' ? 'DESC' : 'ASC');
        }
        $qb->addOrderBy('cardset.specialFlg', 'ASC')
            ->addOrderBy('cardDetail.promotionFlg', 'ASC')
            ->addOrderBy('cardset.releaseDate', 'DESC');
        if (is_null($foilFlg)) {
            $qb->addOrderBy('cardDetail.foilFlg', 'ASC');
        }
```

# 根拠
- 設計：
  - pf-api を正とし、フォイル有無・価格の条件も受け取る: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1145-1147`
  - 処理フローで foil_flg/price を受け取り取得条件に含める: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1166-1178`
  - データ整合性で言語・フォイル有無・価格を条件に商品情報を選ぶ: `hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:1205-1211`
- ec-cube-enterprise：
  - controller は Request/query を読まず cardId/lang のみ渡す: `ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:265-278`
  - repository は固定 ORDER BY で price02 のクエリ連動ソートがない: `ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:2226-2291`
- ベース実装：
  - route は /popup/card/{lang}/{cardId} を ProductController に割り当てる: `pf-api/config/routes.yaml:85-91`
  - controller は foil_flg/price を repository に渡す: `pf-api/src/Controller/ProductController.php:87-93`
  - repository は foil_flg/price 指定に応じて addOrderBy を切り替える: `pf-api/src/Repository/DtbProductSubClassRepository.php:91-122`

# 確認メモ
- 確認コマンド: `rg -n "A02-02|ポップアップ用カード|popup/card|foil_flg|price=high|cardId|findPopupProductByCardId|フォイル|販売価格" hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html`
- 確認コマンド: `rg -n "popup/card|findPopupProductByCardId|foil_flg|price|cardId|Popup.*Card|ProductByCard" ec-cube-enterprise/src/Eccube pf-api/src pf-api/config`
- 確認コマンド: `rg -n "findPopupProductByCardIdAndLang|foilFlg|foil_flg|price" pf-api/src`
- 確認コマンド: `rg -n "findPopupProductByCardId|foil_flg|price02|Request|query->get" ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php`
- 設計HTMLは A02-02 の確認値を pf-api とし、foil_flg と price を外部契約のクエリ条件として定義している。
- pf-api は controller で foil_flg/price を取得して repository に渡し、repository でフォイル区分と販売価格の ORDER BY を条件分岐している。
- ec-cube-enterprise の A02-02 controller/repository には foil_flg/price を受け取る引数・query 取得・SQL条件がなく、固定の cd.foil_flg ASC のみ確認できた。

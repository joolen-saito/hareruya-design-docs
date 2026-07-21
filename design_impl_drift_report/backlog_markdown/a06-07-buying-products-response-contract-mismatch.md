/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：商品IDリストから買取用商品情報を取得
課題カテゴリ：実装違い
課題：買取用商品情報レスポンスのconditionClassesが設計のproductCode・型定義と一致していない
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、POST http://localhost:8080/api/v1/buying/products に ids=<カード商品の商品ID> をフォーム値で送信する
2. レスポンスの cards.<cardId>.details.<detailId>.languageClasses.<languageCode>.conditionClasses.<conditionCode> を確認する
3. 同じ項目について、設計HTML・pf-api の階層定義・ec-cube-enterprise の BuyingCardsFormatter を比較する

# 期待される挙動【必須】
- conditionClasses.<conditionCode> は productClassId, productCode, buyPrice, price, stock, sectionId を返す
- details.<detailId>.foilFlg は boolean として返す
- conditionClasses.<conditionCode>.price と stock は string として返す

# 現在の挙動【必須】
- ec-cube-enterprise では、`BuyingController::getByProductIds()` が `MtbCardRepository::getBuyingCardsByProductIds()` の結果を `BuyingCardsFormatter::format()` に渡し、その結果をそのまま `JsonResponse` で返す。formatter は `conditionClasses` 配下に `productClassCode` を出力し、設計が要求する `productCode` は出力していない。また `foilFlg` は int、`price` は `standardPrice` の int|null、`stock` は int として返る。

ec-cube-enterprise Controller は formatter 結果をそのまま JsonResponse で返す: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:67-93`
```php
    #[Route('/%eccube_api_v1_route%/buying/products', name: 'api_buying_products', methods: ['POST'])]
    public function getByProductIds(Request $request): JsonResponse
    {
        $idsParam = $request->request->get('ids', '');

        // カンマ区切りを配列に変換し、数字のみをフィルタリング
        $productIds = array_filter(
            explode(',', $idsParam),
            static fn (string $id) => preg_match('/^\d+$/', trim($id)) === 1
        );
        $productIds = array_map('intval', $productIds);

        // カード商品以外のIDだけが来た場合、0件となり得るためエラーとはしない
        if (empty($productIds)) {
            return new JsonResponse(['cards' => []]);
        }

        $Member = $this->getUser();
        if (!$Member instanceof Member) {
            throw new UnauthenticatedException('認証エラー');
        }

        [$storeId, $stockLocationId] = $this->resolveBuyingStockContext($Member);

        $cards = $this->mtbCardRepository->getBuyingCardsByProductIds($productIds, $storeId, $stockLocationId);

        return new JsonResponse($this->buyingCardsFormatter->format($cards));
```

ec-cube-enterprise Repository は productClass.code を productClassCode として選択する: `ec-cube-enterprise/src/Eccube/Repository/Master/MtbCardRepository.php:175-199`
```php
            ->select('
                card.id AS cardId,
                card.name_jp AS cardNameJp,
                card.name_en AS cardNameEn,
                cardDetail.id AS detailId,
                cardset.code AS cardSetCode,
                cardset.name_jp AS cardSetNameJp,
                cardDetail.foil_flg AS foilFlg,
                cardDetail.card_no AS cardNo,
                promotion.name_jp AS promotionNameJp,
                product.id AS productId,
                product.name AS productNameJp,
                product.name_en AS productNameEn,
                rarity.code AS rarityCode,
                storageCode.name AS storageCodeName,
                language.code AS languageCode,
                cardCondition.code AS conditionCode,
                productClass.id AS productClassId,
                productClass.code AS productClassCode,
                productClass.buy_price AS buyPrice,
                productClass.standardPrice AS standardPrice,
                productStock.stock AS stock,
                section.id AS sectionId,
                productImage.file_name AS imageFileName
            ');
```

ec-cube-enterprise DTO は productClassCode、int foilFlg、int stock を受け取る: `ec-cube-enterprise/src/Eccube/Dto/Repository/Master/GetBuyingCardsQueryResponseDto.php:25-47`
```php
        public int $cardId,
        public string $cardNameJp,
        public ?string $cardNameEn,
        public int $detailId,
        public ?string $cardSetCode,
        public ?string $cardSetNameJp,
        public int $foilFlg,
        public ?string $cardNo,
        public ?string $promotionNameJp,
        public int $productId,
        public string $productNameJp,
        public ?string $productNameEn,
        public ?string $rarityCode,
        public ?string $storageCodeName,
        public ?string $languageCode,
        public ?string $conditionCode,
        public int $productClassId,
        public string $productClassCode,
        public ?int $buyPrice,
        public ?int $standardPrice,
        public int $stock,
        public ?int $sectionId,
        public ?string $imageFileName,
```

ec-cube-enterprise Formatter は productClassCode を返し、productCode を返さない: `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:83-123`
```php
            // Detailレベル
            if (!isset($cards[$cardId]['details'][$detailId])) {
                $cards[$cardId]['details'][$detailId] = [
                    'cardsetCode' => $dto->cardSetCode,
                    'cardsetName' => $dto->cardSetNameJp,
                    'foilFlg' => $dto->foilFlg,
                    'cardNo' => $dto->cardNo,
                    'promotionName' => $dto->promotionNameJp,
                    'productId' => $dto->productId,
                    'productNameJp' => $dto->productNameJp,
                    'productNameEn' => $dto->productNameEn,
                    'rarityCode' => $dto->rarityCode,
                    'storageCodeName' => $dto->storageCodeName,
                    'languageClasses' => [],
                ];
            }

            // Language レベル
            if (!isset($cards[$cardId]['details'][$detailId]['languageClasses'][$languageCode])) {
                $cards[$cardId]['details'][$detailId]['languageClasses'][$languageCode] = [
                    'conditionClasses' => [],
                ];
            }

            // ConditionClassレベル
            if (!isset($cards[$cardId]['details'][$detailId]['languageClasses'][$languageCode]['conditionClasses'][$conditionCode])) {
                $cards[$cardId]['details'][$detailId]['languageClasses'][$languageCode]['conditionClasses'][$conditionCode] = [];
            }

            // ProductClass情報を追加
            $cards[$cardId]['details'][$detailId]['languageClasses'][$languageCode]['conditionClasses'][$conditionCode] = [
                'productClassId' => $dto->productClassId,
                'productClassCode' => $dto->productClassCode,
                'buyPrice' => $dto->buyPrice,
                'price' => $dto->standardPrice,
                'stock' => $dto->stock,
                'sectionId' => $dto->sectionId,
            ];
        }

        return ['cards' => empty($cards) ? new \stdClass() : $cards];
```
- ベース実装(pf-api)では、`DtbProductRepository::PRODUCTS_HIERALCHY` が `conditionClasses` 配下の返却項目として `productCode` を定義し、`getProductsByProductIdList()` も `productClass.productCode` を選択する。`HierarchicalDataTrait::makeHierarchy()` はこの階層定義のフィールド名をそのままレスポンス配列のキーにするため、ベース実装の外部キーは `productCode` であり `productClassCode` ではない。

ベース実装 pf-api の階層定義は conditionClasses に productCode を含める: `pf-api/src/Repository/DtbProductRepository.php:15-43`
```php
    public const PRODUCTS_HIERALCHY = [
        'cards:cardId' => [
            'cardNameJp',
            'cardNameEn',
            'imageFileName',
            'details:detailId' => [
                'cardsetCode',
                'cardsetName',
                'foilFlg',
                'cardNo',
                'promotionName',
                'productId',
                'productNameJp',
                'productNameEn',
                'rarityCode',
                'storageCodeName',
                'languageClasses:languageCode' => [
                    'conditionClasses:conditionCode' => [
                        'productClassId',
                        'productCode',
                        'buyPrice',
                        'price',
                        'stock',
                        'sectionId'
                    ],
                ],
            ],
        ],
    ];
```

ベース実装 pf-api は productClass.productCode を選択する: `pf-api/src/Repository/DtbProductRepository.php:207-237`
```php
            ->select('
                targetDetail.id,
                card.id AS cardId,
                card.nameJp AS cardNameJp,
                card.nameEn AS cardNameEn,
                product.productId,
                product.name AS productNameJp,
                productSub.nameEn AS productNameEn,
                storageCode.name AS storageCodeName,
                productClass.productClassId,
                productClass.productCode,
                productClass.price02 AS price,
                productSubClass.buyPrice,
                productSubClass.sectionId AS sectionId,
                productClass.stock,
                cardDetail.id AS detailId,
                cardDetail.foilFlg,
                cardDetail.cardNo,
                rarity.code AS rarityCode,
                promotion.nameJp AS promotionName,
                cardCondition.code AS conditionCode,
                language.code AS languageCode,
                cardset.code AS cardsetCode,
                cardset.nameJp AS cardsetName,
                productImage.fileName AS imageFileName
            ')
            ->groupBy('productClass.productClassId');

        $result = $qb->getQuery()->getResult();

        return $this->makeHierarchy(self::PRODUCTS_HIERALCHY, $result);
```

ベース実装 pf-api の階層化処理は定義されたフィールド名をレスポンスキーにする: `pf-api/src/Repository/HierarchicalDataTrait.php:19-48`
```php
    public function makeHierarchy(array $hierarchy, array $data)
    {
        $tree = [];
        foreach ($data as $record) {
            [$childName, $childKey] = explode(':', key($hierarchy));
            $this->recursiveLoad($tree[$childName], $childKey, reset($hierarchy), $record);
        }

        return $tree;
    }

    /**
     * 再帰的に階層化
     *
     * @param array $parent 親ノード
     * @param string $keyName キー名
     * @param array $hierarchy 子ノードの階層構造定義
     * @param array $record 非階層化データ
     */
    private function recursiveLoad(&$parent, $keyName, $hierarchy, $record)
    {
        foreach ($hierarchy as $key => $field) {
            if (gettype($field) === 'array') {
                // 階層を持つ子のキーは''
                [$childName, $childKey] = explode(':', $key);
                $this->recursiveLoad($parent[$record[$keyName]][$childName], $childKey, $field, $record);
                continue;
            }
            $parent[$record[$keyName]][$field] = $record[$field];
        }
```

# 根拠
- 設計：
  - A06-07 のサンプルレスポンスは foilFlg boolean、conditionClasses 配下の productCode、price/stock 文字列を示す: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:2290-2314`
  - 同じ設計HTML内のレスポンス定義でも productCode、price string、stock string を要求する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:2508-2538`
- ec-cube-enterprise：
  - Controller は formatter 結果を変換せず JsonResponse で返す: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php:67-93`
  - Repository/DTO/Formatter は productClassCode を生成・出力し productCode を出力しない: `ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php:83-123`
- ベース実装：
  - pf-api は productCode をレスポンス階層定義に含める: `pf-api/src/Repository/DtbProductRepository.php:15-43`
  - pf-api は productClass.productCode を選択し階層化して返す: `pf-api/src/Repository/DtbProductRepository.php:207-237`

# 確認メモ
- 確認コマンド: `rg -n "conditionClasses|productClassCode|productCode|foilFlg|buyPrice|standardPrice|BuyingCardsFormatter|find.*Buying|cardIds|商品IDリスト" excel_to_html/output/0506_基本設計仕様書\(API_店頭買取管理\).html ../ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1 ../ec-cube-enterprise/src/Eccube/Repository ../pf-api ../deck-api --glob '!vendor/**' --glob '!var/**'`
- 確認コマンド: `rg -n "productClassCode|conditionClasses|standardPrice|sectionId|foilFlg" ../ec-cube-enterprise/src/Eccube/Repository ../ec-cube-enterprise/src/Eccube/Dto ../ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1 --glob '!var/**'`
- 確認コマンド: `rg -n "PRODUCTS_HIERALCHY|productClass.productCode|makeHierarchy|conditionClasses:conditionCode" ../pf-api/src/Repository/DtbProductRepository.php ../pf-api/src/Repository/HierarchicalDataTrait.php`
- 確認コマンド: `rg -n "buying/products|getByProductIds|BuyingCardsFormatter|JsonResponse" ../ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyingController.php ../ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/BuyingCardsFormatter.php`

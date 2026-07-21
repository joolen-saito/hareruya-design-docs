/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：固定価格部門の部門情報を取得
課題カテゴリ：実装違い
課題：固定価格部門取得APIが成功時にcode/section_idを返さず、未設定時もHTTP 500ではなく空文字のHTTP 200を返す
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. JWT認証済みの状態で、GET http://localhost:8080/api/v1/admin/fixedPriceSection.json を実行する
2. mtb_option に option_key=fixed_price_section が存在する場合のレスポンス本文が code と section_id を持つJSONオブジェクトか確認する
3. mtb_option から option_key=fixed_price_section を削除した状態で同じAPIを実行し、HTTPステータスとレスポンス本文を確認する

# 期待される挙動【必須】
- 成功時は HTTP 200 で、code: 200 と section_id: <固定価格部門ID> を持つJSONオブジェクトを返す
- section_id はオプションマスタの固定価格部門設定値を文字列として返す
- オプションマスタに固定価格部門の設定が存在しない場合は、pf-api と同じく null参照による例外となり、HTTP 500 のフレームワーク標準例外応答を返す

# 現在の挙動【必須】
- ec-cube-enterprise では、`/%eccube_api_v1_route%/admin/fixedPriceSection.json` の Controller が `MtbOption::FIXED_PRICE_SECTION` を検索し、`$Option?->getOptionValue() ?? ''` で未設定を空文字にフォールバックしている。戻り値は `new JsonResponse($value)` であり、成功時も `code` / `section_id` を持つJSONオブジェクトではなく、固定価格部門IDのJSON文字列だけを返す。未設定時も例外を発生させず、空文字のJSON文字列を HTTP 200 で返す。

ec-cube-enterprise Controller は nullsafe で空文字にフォールバックし、JsonResponse($value) を返す: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:47-59`
```php
    /**
     * 固定価格部門IDの取得
     */
    #[Route('/%eccube_api_v1_route%/admin/fixedPriceSection.json', name: 'api_admin_fixed_price_section', methods: ['GET'])]
    public function getFixedPriceSection(): JsonResponse
    {
        $Option = $this->mtbOptionRepository->findOneBy([
            'option_key' => MtbOption::FIXED_PRICE_SECTION,
        ]);

        $value = $Option?->getOptionValue() ?? '';

        return new JsonResponse($value);
```

ec-cube-enterprise の正常系テストは JSON文字列だけを期待する: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:155-185`
```php
    public function testGetFixedPriceSection(): void
    {
        // Arrange
        $expectedValue = '29';

        // 既存データがあれば更新、なければ作成しておく
        $Option = $this->mtbOptionRepository->findOneBy(['option_key' => MtbOption::FIXED_PRICE_SECTION]);
        if ($Option === null) {
            $Option = new MtbOption();
            $Option->setOptionKey(MtbOption::FIXED_PRICE_SECTION);
        }
        $Option->setOptionValue($expectedValue);
        $Option->setUpdateDate(new \DateTime());
        $this->entityManager->persist($Option);
        $this->entityManager->flush();

        // JWT認証トークンを生成
        $token = $this->jwtTokenService->createToken($this->Member->getId());

        // Act
        $this->client->request(
            Request::METHOD_GET,
            '/api/v1/admin/fixedPriceSection.json',
            [],
            [],
            ['HTTP_JWT_TOKEN' => $token]
        );

        // Assert
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame(json_encode($expectedValue), $this->client->getResponse()->getContent());
```

ec-cube-enterprise の未設定時テストは HTTP 200 と空文字を期待する: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:188-218`
```php
    /**
     * getFixedPriceSection - 異常系
     * オプションが存在しない場合は空文字を返すこと
     *
     * @group HARERUYA
     */
    public function testGetFixedPriceSectionWhenNotFound(): void
    {
        // Arrange
        // 既存データがあれば削除しておく
        $Option = $this->mtbOptionRepository->findOneBy(['option_key' => MtbOption::FIXED_PRICE_SECTION]);
        if ($Option !== null) {
            $this->entityManager->remove($Option);
            $this->entityManager->flush();
        }

        // JWT認証トークンを生成
        $token = $this->jwtTokenService->createToken($this->Member->getId());

        // Act
        $this->client->request(
            Request::METHOD_GET,
            '/api/v1/admin/fixedPriceSection.json',
            [],
            [],
            ['HTTP_JWT_TOKEN' => $token]
        );

        // Assert
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame(json_encode(''), $this->client->getResponse()->getContent());
```
- ベース実装(pf-api)では、`/fixedPriceSection.json` が `ProductController::getFixedPriceSection` に向き、Controller は `findOneBy(...)->getOptionValue()` を直列に呼び出している。そのため設定が存在しない場合は null への `getOptionValue()` 呼び出しで例外になり、設計に記載された未設定時 HTTP 500 の挙動になる。成功時は `code` と `section_id` を持つJSONオブジェクトを返す。

ベース実装 pf-api は fixedPriceSection.json を ProductController へ定義する: `pf-api/config/routes.yaml:243-246`
```yaml
get_fixed_price_section:
    path: /fixedPriceSection.json
    controller: App\Controller\ProductController::getFixedPriceSection
    methods: GET
```

ベース実装 pf-api は nullsafe を使わず、成功時 code/section_id を返す: `pf-api/src/Controller/ProductController.php:497-507`
```php
    public function getFixedPriceSection(): JsonResponse
    {
        $section = $this->getDoctrine()
            ->getRepository(MtbOption::class)
            ->findOneBy(['optionKey' => MtbOption::FIXED_PRICE_SECTION])
            ->getOptionValue();

        return $this->json([
            'code' => Response::HTTP_OK,
            'section_id' => $section
        ], Response::HTTP_OK);
```

# 根拠
- 設計：
  - 基本設計は code と section_id を返すレスポンスを示す: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3210-3228`
  - 詳細設計は pf-api を正とし、未設定時は null参照によりHTTP 500とする: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3241-3277`
  - 成功時レスポンス定義は code integer と section_id string を要求する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3273-3283`
- ec-cube-enterprise：
  - enterprise は JSON文字列または空文字を返す: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:47-59`
  - enterprise テストは未設定時 HTTP 200 + 空文字を期待する: `ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:188-218`
- ベース実装：
  - pf-api は nullsafe なしで optionValue を取得し、code/section_id オブジェクトを返す: `pf-api/src/Controller/ProductController.php:497-507`

# 確認メモ
- 確認コマンド: `rg -n "A06-12|固定価格部門|fixedPriceSection|FIXED_PRICE_SECTION|section_id|fixed_price" excel_to_html/output/0506_基本設計仕様書\(API_店頭買取管理\).html ../ec-cube-enterprise/src ../ec-cube-enterprise/tests ../pf-api --glob '!vendor/**' --glob '!var/**'`
- 確認コマンド: `rg -n "fixedPriceSection|FIXED_PRICE_SECTION|固定価格部門" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/tests --glob '!var/**'`
- 確認コマンド: `rg -n "get_fixed_price_section|fixedPriceSection\.json|getFixedPriceSection|FIXED_PRICE_SECTION|getOptionValue|section_id" ../pf-api/config/routes.yaml ../pf-api/src/Controller/ProductController.php`
- 確認コマンド: `rg -n "api_admin_fixed_price_section|fixedPriceSection\.json|JsonResponse\(\$value\)|json_encode\(''\)|json_encode\(\$expectedValue\)" ../ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php ../ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php`

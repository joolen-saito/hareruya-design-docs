# b02-05_0404_sheet-7_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b02-05_0404_sheet-7_sheet.json#b02-05_0404_sheet-7_sheet-conformance-a6e9facf54fe`
- 機能: B02-05 B02-05 お気に入り商品セール通知
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は dtb_favorite_product / dtb_player を抽出元とするが、実装は dtb_customer_favorite_product(CustomerFavoriteProduct)と Customer を join して抽出している。

## 判定理由
設計はリニューアル移行表(1404行)とDBカラム表(1435行)で、お気に入りは dtb_favorite_product(product_id・player_id・language_id)、会員(選手情報)は dtb_player(first_name_jp・last_name_jp・email)を抽出元・宛先とすると正典化している。実装のバッチ BatchFavoriteSaleNotificationAction は CustomerFavoriteProductRepository::findSaleFavoriteProducts() を呼び、同メソッド(230行〜)は createQueryBuilder('cfp')(CustomerFavoriteProduct=テーブル dtb_customer_favorite_product)で cfp.Customer を join し c.name01・c.name02・c.email を取得する。DtbFavoriteProductRepository には findSaleFavoriteProducts が存在するがコメントアウト(39行〜)されており、稼働経路は Customer 系。設計が指す dtb_favorite_product.player_id/language_id・dtb_player の氏名/email は抽出に使われていない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1435-1435` — 設計要求

```html
          <div class="table-wrap"><table><thead><tr><th>テーブル</th><th>列</th><th>メモ</th></tr></thead><tbody><tr><td><code>dtb_favorite_product</code></td><td><code>product_id</code>・<code>language_id</code>・<code>player_id</code></td><td>セール中の抽出と会員ごとの集約に使用する。</td></tr><tr><td><code>dtb_player</code></td><td><code>first_name_jp</code>・<code>last_name_jp</code>・<code>email</code></td><td>通知メールの宛先・本文に使用する。都道府県の住所参照元はec-cube-enterprise実装で要確認。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
CustomerFavoriteProduct と Customer を join
`ec-cube-enterprise/src/Eccube/Repository/CustomerFavoriteProductRepository.php:230-243` — 抽出リポジトリ

```php
    public function findSaleFavoriteProducts(): array
    {
        return $this->createQueryBuilder('cfp')
            ->select(
                'c.id AS customer_id',
                'c.name01',
                'c.name02',
                'c.email',
                'pref.id AS pref_id',
                'p.name AS product_name',
                'p.name_en AS product_name_en',
                'l.code AS lang_code',
            )
            ->join('cfp.Customer', 'c')
```

CustomerFavoriteProduct は dtb_customer_favorite_product
`ec-cube-enterprise/src/Eccube/Entity/CustomerFavoriteProduct.php:24-24` — テーブル名

```php
    #[ORM\Table(name: 'dtb_customer_favorite_product')]
```

CustomerFavoriteProductRepository/CustomerRepository を注入
`ec-cube-enterprise/src/Eccube/Service/Product/BatchFavoriteSaleNotificationAction.php:24-38` — バッチの依存先

```php
    public function __construct(
        private readonly CustomerFavoriteProductRepository $customerFavoriteProductRepository,
        private readonly CustomerRepository $customerRepository,
        private readonly MailService $mailService,
    ) {
    }

    /**
     * お気に入り登録商品がセール中の会員にメール通知する。
     *
     * @return int 送信した会員数
     */
    public function handle(): int
    {
        $rows = $this->customerFavoriteProductRepository->findSaleFavoriteProducts();
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。稼働経路 BatchFavoriteSaleNotificationAction::handle() は customerFavoriteProductRepository->findSaleFavoriteProducts()(CustomerFavoriteProductRepository.php)を呼び、当該メソッドは createQueryBuilder('cfp')→join('cfp.Customer','c')→c.name01/c.name02/c.email を抽出。CustomerFavoriteProduct のテーブルは dtb_customer_favorite_product(Entity/CustomerFavoriteProduct.php:24)で、設計が正典化する dtb_favorite_product / dtb_player ではない。dtb_favorite_product 用の DtbFavoriteProductRepository::findSaleFavoriteProducts(playerId/player 系, dtb_player join)は 39-69行で丸ごとコメントアウトされ未使用。findSaleFavoriteProducts の実呼び出しは CustomerFavoriteProduct 版のみ(rg で全件確認)。DtbFavoriteProduct/DtbPlayer エンティティは存在しフロント側お気に入り(ProductController/MypageController)では使われるが、本バッチは別テーブル(Customer系)を参照しており設計の dtb_favorite_product.player_id/language_id・dtb_player 氏名/email を抽出に用いていない。別実装なし。

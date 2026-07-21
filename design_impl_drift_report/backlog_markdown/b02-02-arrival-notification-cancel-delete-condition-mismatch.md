/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：バッチ商品管理
機能：入荷通知キャンセル
課題カテゴリ：実装違い
課題：入荷通知キャンセルバッチの削除対象条件が設計と異なる
設計書：0404_基本設計仕様書(バッチ_商品管理).xlsx

# 再現手順【必須】
1. ec-cube-enterprise の DB で deleted_at が NULL の dtb_product_request を用意し、紐づく dtb_product_class.visible を false にする
2. 別ケースとして、dtb_product_request.product_class_id に紐づく dtb_product_class の product_id が存在しない状態、または商品が公開対象外の状態を用意する
3. bin/console eccube:cancel-product-request を実行し、対象の dtb_product_request.deleted_at が設定されるか確認する
4. 設計書の B02-02 入荷通知キャンセルの削除条件と、ec-cube-enterprise の BatchCancelProductRequestAction / DtbProductRequestRepository の実行SQLを照合する

# 期待される挙動【必須】
- deleted_at が未設定の入荷通知リクエストのうち、対応する商品規格が削除相当の場合は削除日時を設定する
- 移行先では商品規格の削除相当を dtb_product_class.visible で判定する
- 紐づく商品が存在しない、または商品が公開対象外の場合も削除日時を設定する
- ベース実装と同様に、商品不存在を LEFT OUTER JOIN で検出できる条件にする

# 現在の挙動【必須】
- ec-cube-enterprise の B02-02 実行経路は `BatchCancelProductRequestAction::handle()` から `DtbProductRequestRepository::cancelRequestByProductStatus()` のみを呼び出す。実行されるSQLは `dtb_product_class pc JOIN dtb_product p` の INNER JOIN で、条件は `pc.product_status_id` または `p.product_status_id` の非公開・廃止判定であり、設計が移行先の商品規格削除相当として示す `pc.visible` を見ていない。また INNER JOIN のため、紐づく商品が存在しないケースはサブクエリから落ちる。

ec-cube-enterprise B02-02 action は cancelRequestByProductStatus のみを呼ぶ: `ec-cube-enterprise/src/Eccube/Service/Product/BatchCancelProductRequestAction.php:20-35`
```php
class BatchCancelProductRequestAction
{
    public function __construct(
        private readonly DtbProductRequestRepository $productRequestRepository,
    ) {
    }

    /**
     * 商品・商品規格の公開ステータスが非公開・廃止の入荷通知リクエストをキャンセルする。
     *
     * @return int キャンセル件数
     */
    public function handle(): int
    {
        return $this->productRequestRepository->cancelRequestByProductStatus();
    }
```

ec-cube-enterprise 実行中の削除条件は product_status_id と INNER JOIN を使う: `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:473-493`
```php
    public function cancelRequestByProductStatus(): int
    {
        $sql = <<<SQL
            UPDATE dtb_product_request
            SET deleted_at = :now
            WHERE deleted_at IS NULL
              AND product_class_id IN (
                  SELECT pc.id
                  FROM dtb_product_class pc
                  JOIN dtb_product p ON pc.product_id = p.id
                  WHERE pc.product_status_id IN (:hide, :abolished)
                     OR p.product_status_id IN (:hide, :abolished)
              )
            SQL;

        return $this->getEntityManager()->getConnection()->executeStatement($sql, [
            'now' => (new \DateTime())->format(self::MYSQL_DATE_FORMAT),
            'hide' => ProductStatus::DISPLAY_HIDE,
            'abolished' => ProductStatus::DISPLAY_ABOLISHED,
        ]);
    }
```

ec-cube-enterprise には visible カラムがあるが B02-02 のSQLでは使われていない: `ec-cube-enterprise/src/Eccube/Entity/ProductClass.php:207-208`
```php
        #[ORM\Column(name: 'visible', type: Types::BOOLEAN, options: ['default' => true])]
        private ?bool $visible = null;
```

ec-cube-enterprise には旧条件風の deleteRequestByNonProduct が残るが B02-02 から呼ばれていない: `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:438-466`
```php
    public function deleteRequestByNonProduct(): void
    {
        $time = new \DateTime();
        $sql = <<<EOT
UPDATE
    dtb_product_request pr
JOIN dtb_product_class pc ON pr.product_class_id = pc.product_class_id
LEFT OUTER JOIN dtb_product p ON pc.product_id = p.product_id
SET
    pr.deleted_at = ?
WHERE
    pr.deleted_at IS NULL
AND (
    pc.del_flg = 1
OR
    p.product_id IS NULL
OR
    p.del_flg = 1
)
EOT;

        $connection = $this->getEntityManager()->getConnection();
        $connection->executeUpdate(
            $sql,
            [
                $time->format(self::MYSQL_DATE_FORMAT),
            ]
        );
    }
```
- ベース実装(pf-eccube3)では、B02-02 の `DeleteProductRequest::execute()` が `deleteRequestByNonProduct()` を呼び、SQLは `LEFT OUTER JOIN dtb_product` と `pc.del_flg = 1 OR p.product_id IS NULL OR p.del_flg = 1` で、商品規格削除・商品不存在・商品削除を対象にしている。

ベース実装 pf-eccube3 DeleteProductRequest は deleteRequestByNonProduct を呼び出す: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/DeleteProductRequest.php:24-30`
```php
    /**
     * delete non product requests
     */
    public function execute()
    {
        $this->app['hareruya_ec.repository.product_request']->deleteRequestByNonProduct();
    }
```

ベース実装 pf-eccube3 は商品不存在を LEFT OUTER JOIN で検出する: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:250-278`
```php
    public function deleteRequestByNonProduct()
    {
        $time = new \DateTime();
        $sql = <<<EOT
UPDATE
    dtb_product_request pr
JOIN dtb_product_class pc ON pr.product_class_id = pc.product_class_id
LEFT OUTER JOIN dtb_product p ON pc.product_id = p.product_id
SET
    pr.deleted_at = ?
WHERE
    pr.deleted_at IS NULL
AND (
    pc.del_flg = 1
OR
    p.product_id IS NULL
OR
    p.del_flg = 1
)
EOT;

        $connection = $this->getEntityManager()->getConnection();
        $connection->executeUpdate(
            $sql,
            [
                $time->format(self::MYSQL_DATE_FORMAT),
            ]
        );
    }
```

# 根拠
- 設計：
  - 設計HTMLは移行先の商品規格削除相当を visible、商品の削除相当を商品不存在または product_status_id としている: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1034-1037`
  - 設計HTMLは未削除の入荷通知リクエストのうち、商品規格削除または商品不存在・削除済みを対象に削除日時を設定するとしている: `hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1047-1054`
- ec-cube-enterprise：
  - enterprise の B02-02 実行経路は product_status_id 条件のSQLのみを呼び、visible と商品不存在を条件に含めない: `ec-cube-enterprise/src/Eccube/Repository/DtbProductRequestRepository.php:473-493`
  - enterprise の B02-02 action は cancelRequestByProductStatus のみを呼び出す: `ec-cube-enterprise/src/Eccube/Service/Product/BatchCancelProductRequestAction.php:27-35`
- ベース実装：
  - pf-eccube3 は B02-02 で deleteRequestByNonProduct を実行する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Product/DeleteProductRequest.php:24-30`
  - pf-eccube3 は商品規格削除、商品不存在、商品削除を条件にする: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbProductRequestRepository.php:250-278`

# 確認メモ
- 確認コマンド: `rg -n "入荷通知キャンセル|dtb_product_class.visible|商品が存在しない|削除条件|product:batch deleteProductRequest" excel_to_html/output/0404_基本設計仕様書\(バッチ_商品管理\).html design_impl_drift_report/findings/b02-02_0404_sheet-4_sheet.json`
- 確認コマンド: `rg -n "deleteRequestByNonProduct|LEFT OUTER JOIN dtb_product|p\.product_id IS NULL|pc\.del_flg|DeleteProductRequest" ../pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "deleteRequestByNonProduct|cancelRequestByProductStatus|BatchCancelProductRequestAction|pc\.visible|product_status_id IN|LEFT OUTER JOIN dtb_product|p\.product_id IS NULL" ../ec-cube-enterprise/src/Eccube ../ec-cube-enterprise/app`
- 設計HTMLは、現行の削除フラグ相当を移行先では商品規格 visible と商品 product_status_id/不存在に置き換えると記載している。
- pf-eccube3 は deleteRequestByNonProduct で LEFT OUTER JOIN を使い、商品不存在を削除対象に含める。
- ec-cube-enterprise の実行経路は cancelRequestByProductStatus のみで、pc.visible と商品不存在を条件に含めない。

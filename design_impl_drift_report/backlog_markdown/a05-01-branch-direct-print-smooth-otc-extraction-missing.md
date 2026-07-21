/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：注文印刷_印刷情報をプリンタへ送信
課題カテゴリ：実装漏れ
課題：支店向け注文印刷でスムーズ店頭受取の受注が印刷対象に含まれない
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. 支店のBaseInfoに紐づく、配送方法がスムーズ店頭受取で、所定の支払方法・未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードありの受注を用意する
2. ec-cube-enterprise の注文印刷API POST http://localhost:8080/api/order/prints/direct/{支店base_info_id} に ConnectionType=GetRequest を指定して呼び出す
3. 返却される印刷情報XMLに、条件を満たすスムーズ店頭受取の受注が含まれるか確認する

# 期待される挙動【必須】
- 印刷対象の受注一覧には、店頭受取で注文受領の受注を含める
- 印刷対象の受注一覧には、スムーズ店頭受取で所定の支払方法かつ未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードありの受注を含める
- 印刷対象の受注一覧には、ブラウザ印刷フラグが立つ受注を含める
- 取得件数は最大10件とする

# 現在の挙動【必須】
- ec-cube-enterprise では、`BaseInfo` が本店でない場合に支店向けの `getDirectPrintOrderList($base_info_id)` を呼び出す。この支店向けSQLは、店頭受取の注文受領分岐と `browser_print_flg = true` 分岐だけで構成されており、`Delivery::SMOOTH_OTC`、所定支払方法、未確定・未出荷・未取消・未受領・店頭予約日なし・スマレジコードありのスムーズ店頭受取分岐を持たない。

ec-cube-enterprise は本店以外で支店向け getDirectPrintOrderList を呼び出す: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:37-48`
```php
    public function handle(OrderDirectPrintInput $input): string
    {
        $uri = $input->uri;
        $base_info_id = $input->base_info_id;

        $BaseInfo = $this->baseInfoRepository->find($base_info_id);

        if ($BaseInfo && $BaseInfo->isMainShop()) {
            $OrderDataList = $this->orderRepository->getPrintOrderListMainShop($base_info_id);
        } else {
            $OrderDataList = $this->orderRepository->getDirectPrintOrderList($base_info_id);
        }
```

ec-cube-enterprise 支店向け印刷対象取得は OTC NEW と browser_print_flg のみで smoothOtc 分岐がない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1550-1618`
```php
    public function getDirectPrintOrderList(int $base_info_id): array
    {
        $sql = <<<EOT
            (
                SELECT
                    o.id AS order_id,
                    o.order_date,
                    o.order_number,
                    CONCAT(o.kana01, ' ', o.kana02) AS name_kana,
                    CONCAT(o.name01, ' ', o.name02) AS name,
                    o.payment_total,
                    '□' AS expensive,
                    o.smaregi_code,
                    CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS has_message
                FROM dtb_order o
                JOIN dtb_shipping s ON s.order_id = o.id
                JOIN mtb_order_status os ON os.id = o.order_status_id
                WHERE o.base_info_id = :baseInfoId
                  AND o.order_number IS NOT NULL
                  AND s.delivery_id = :otc
                  AND o.order_status_id = :orderNew
                  AND o.smaregi_code IS NOT NULL
                GROUP BY o.id
            )
            UNION
            (
                SELECT
                    o.id AS order_id,
                    o.order_date,
                    o.order_number,
                    CONCAT(o.kana01, ' ', o.kana02) AS name_kana,
                    CONCAT(o.name01, ' ', o.name02) AS name,
                    o.payment_total,
                    '□' AS expensive,
                    o.smaregi_code,
                    CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS has_message
                FROM dtb_order o
                JOIN dtb_shipping s ON s.order_id = o.id
                WHERE o.base_info_id = :baseInfoId
                    AND o.order_number IS NOT NULL
                    AND o.browser_print_flg = true
                GROUP BY o.id
            )
            LIMIT 10
            EOT;

        $rsm = new ResultSetMapping();
        $rsm
            ->addScalarResult('order_id', 'order_id')
            ->addScalarResult('order_date', 'order_date', 'datetimetz')
            ->addScalarResult('order_number', 'order_number')
            ->addScalarResult('name_kana', 'name_kana')
            ->addScalarResult('name', 'name')
            ->addScalarResult('payment_total', 'payment_total')
            ->addScalarResult('expensive', 'expensive')
            ->addScalarResult('smaregi_code', 'smaregi_code')
            ->addScalarResult('has_message', 'hasMessage')
        ;

        $result = $this->getEntityManager()
            ->createNativeQuery($sql, $rsm)
            ->setParameters([
                'baseInfoId' => $base_info_id,
                'otc' => Delivery::OTC,
                'orderNew' => OrderStatus::NEW,
            ])
            ->getResult();

        return $result;
```
- ベース実装(pf-api)では、単一の `getPrintOrderList()` が店頭受取の注文受領分岐、スムーズ店頭受取の支払方法・各日時未設定・スマレジコードあり分岐、ブラウザ印刷フラグ分岐をまとめて抽出し、最大10件に制限している。

ベース実装 pf-api は smoothOtc 条件を印刷対象抽出に含める: `pf-api/src/Repository/DtbOrderRepository.php:21-63`
```php
    public function getPrintOrderList()
    {
        $qb = $this->createQueryBuilder('o')
            ->select([
                'o.orderId AS order_id',
                'o.orderDate AS order_date',
                'os.orderNumber AS order_number',
                "CONCAT(o.orderKana01, ' ', o.orderKana02) AS name_kana",
                "CONCAT(o.orderName01, ' ', o.orderName02) AS name",
                'o.paymentTotal AS payment_total',
                'o.status',
                "'□' AS expensive",
                'os.smaregiCode AS smaregi_code',
                'CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS hasMessage',
            ])
            ->join('o.orderSub', 'os')
            ->join('\App\Entity\DtbShipping', 's', 'WITH', 's.order = o')
            ->where('os.orderNumber IS NOT NULL')
            ->andWhere('s.delivery = :otc AND o.status = :orderNew')
            ->orWhere('s.delivery = :smoothOtc
                AND o.status <> :processing
                AND o.payment IN (:payments)
                AND os.confirmDate IS NULL
                AND o.commitDate IS NULL
                AND os.shippingDate IS NULL
                AND os.cancelDate IS NULL
                AND os.receiptDate IS NULL
                AND os.otcRsvDate IS NULL
                AND os.smaregiCode IS NOT NULL'
            )
            ->orWhere('os.browserPrintFlg = 1')
            ->setParameters([
                'otc' => DtbDelivery::OTC,
                'orderNew' => MtbOrderStatus::ORDER_NEW,
                'smoothOtc' => DtbDelivery::SMOOTH_OTC,
                'processing' => MtbOrderStatus::ORDER_PROCESSING,
                'payments' => [DtbPayment::EC_CREDIT, DtbPayment::EC_SPLINKS_CREDIT, DtbPayment::EC_PAYMENT_NONE],
            ])
            ->groupBy('o.orderId')
            ->setMaxResults(10)
        ;

        return $qb->getQuery()->getResult();
```

# 根拠
- 設計：
  - 印刷対象受注の抽出条件: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1277-1278`
  - 配送方法は店頭受取・スムーズ店頭受取の判別と抽出条件に用いる: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1106-1107`
- ec-cube-enterprise：
  - 本店以外では支店向け印刷対象取得を呼び出す: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:37-48`
  - 本店向け取得には smoothOtc 分岐がある: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1493-1540`
  - 支店向け取得には smoothOtc 分岐がない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1550-1618`
- ベース実装：
  - pf-api は smoothOtc 条件を含む単一抽出を実装している: `pf-api/src/Repository/DtbOrderRepository.php:21-63`

# 確認メモ
- 確認コマンド: `rg -n "印刷対象の受注一覧|スムーズ店頭受取|所定の支払方法|未確定|未出荷|未取消|未受領|店頭予約日|スマレジコード|ブラウザ印刷フラグ|最大10件" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json`
- 確認コマンド: `rg -n "getPrintOrderList|SMOOTH_OTC|smoothOtc|otc_rsv_date|receiptDate|browser_print_flg|setMaxResults|LIMIT 10|payment_total|Delivery::SMOOTH_OTC|DtbDelivery::SMOOTH_OTC|EC_CREDIT|EC_SPLINKS|EC_PAYMENT_NONE" pf-api/src/Controller/Admin/OrderController.php pf-api/src/Repository ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php`
- 確認コマンド: `nl -ba pf-api/src/Repository/DtbOrderRepository.php | sed -n '1,70p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1493,1540p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1550,1618p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php | sed -n '37,48p'`
- 既存の a05-01-smooth-otc-payment-total-label-missing は、選択済み受注の印字内容で payment_total を文言へ置換しない問題を扱う。
- 本項目は印字前の抽出条件の問題であり、支店向け getDirectPrintOrderList がスムーズ店頭受取の通常条件分岐を持たない点に限定する。
- gpt-5.5 high の批判的レビューでも、印字内容差分とは失敗モードと修正対象が異なる別問題として VERIFIED 判定された。

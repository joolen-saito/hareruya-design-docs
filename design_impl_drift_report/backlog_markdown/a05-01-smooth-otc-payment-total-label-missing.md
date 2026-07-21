/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：注文印刷_印刷情報をプリンタへ送信
課題カテゴリ：実装漏れ
課題：スムーズ店頭受取の注文印刷で合計金額欄が「スムーズ店頭受取」にならない
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. 配送方法がスムーズ店頭受取で、A05-01 の印刷対象条件を満たす受注を用意する
2. ec-cube-enterprise の注文印刷 API で ConnectionType=GetRequest の印刷情報を取得する（例: POST http://localhost:8080/api/order/prints/direct/{base_info_id} に ConnectionType=GetRequest を指定）
3. 返却された印刷情報 XML の「合計金額」欄に出力される値を確認する

# 期待される挙動【必須】
- GetRequest の印刷情報生成時、受注ごとに配送方法を判定する
- 配送がスムーズ店頭受取の場合、合計金額欄には payment_total の金額ではなく「スムーズ店頭受取」と出力する
- この配送方法判定は dtb_shipping の配送方法を用いる

# 現在の挙動【必須】
- ec-cube-enterprise では、印刷XML生成時に $paymentTotal = $Order['payment_total'] を設定し、その値を合計金額欄へそのまま出力している。getPrintData() 内に配送方法の取得や Delivery::SMOOTH_OTC 判定はなく、スムーズ店頭受取時に文言へ置換する処理がない。

ec-cube-enterprise 印刷XML生成は payment_total をそのまま合計金額欄へ出力する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:71-129`
```php
    private function getPrintData(array $Order, string $uri): string
    {
        $orderDate = $Order['order_date'] !== null ? $Order['order_date']->format('Y/m/d H:i') : '';
        $paymentTotal = $Order['payment_total'];
        $orderName = htmlspecialchars($Order['name_kana'] ?: $Order['name'], ENT_XML1, 'UTF-8');
        $contactText = $Order['hasMessage'] ? '問い合わせ有' : '';
        $orderNumber = htmlspecialchars((string) $Order['order_number'], ENT_XML1, 'UTF-8');
        $smaregiCode = htmlspecialchars((string) $Order['smaregi_code'], ENT_XML1, 'UTF-8');

        return <<<EOX
          <ePOSPrint>
            <Parameter>
              <devid>local_printer</devid>
              <timeout>10000</timeout>
              <printjobid>{$Order['order_id']}</printjobid>
            </Parameter>
            <PrintData>
              <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
                <text lang="ja"/>
                <page>
                  <area x="0" y="0" width="512" height="751"/>
                  <rectangle x1="0" y1="0" x2="511" y2="200" style="thin"/>
                  <position x="18" y="25"/>
                  <text>店頭注文番号</text>
                  <rectangle x1="0" y1="0" x2="511" y2="200" style="thin"/>
                  <position x="200" y="150"/>
                  <text width="5" height="5">{$orderNumber}</text>
                  <rectangle x1="0" y1="200" x2="511" y2="400" style="thin"/>
                  <rectangle x1="0" y1="200" x2="175" y2="400" style="thin"/>
                  <position x="18" y="225"/>
                  <text width="1" height="1">注文詳細URL</text>
                  <position x="14" y="243"/>
                  <symbol type="qrcode_model_2" level="default" width="5" height="0" size="0">{$uri}admin/order/{$Order['order_id']}/edit</symbol>
                  <position x="179" y="230"/>
                  <text>備考　　{$contactText}</text>
                  <rectangle x1="0" y1="400" x2="210" y2="450" style="thin"/>
                  <position x="25" y="434"/>
                  <text>注文日</text>
                  <rectangle x1="210" y1="400" x2="511" y2="450" style="thin"/>
                  <position x="235" y="434"/>
                  <text>{$orderDate}</text>
                  <rectangle x1="0" y1="450" x2="210" y2="500" style="thin"/>
                  <position x="25" y="484"/>
                  <text>注文番号</text>
                  <rectangle x1="210" y1="450" x2="511" y2="500" style="thin"/>
                  <position x="235" y="484"/>
                  <text>{$orderNumber}</text>
                  <rectangle x1="0" y1="500" x2="210" y2="550" style="thin"/>
                  <position x="25" y="534"/>
                  <text>お客様名</text>
                  <rectangle x1="210" y1="500" x2="511" y2="550" style="thin"/>
                  <position x="235" y="534"/>
                  <text>{$orderName}</text>
                  <rectangle x1="0" y1="550" x2="210" y2="600" style="thin"/>
                  <position x="25" y="584"/>
                  <text>合計金額</text>
                  <rectangle x1="210" y1="550" x2="511" y2="600" style="thin"/>
                  <position x="235" y="584"/>
                  <text>{$paymentTotal}</text>
```

ec-cube-enterprise 印刷対象取得は payment_total を渡すが配送方法を印字データへ渡さない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1493-1540`
```php
    public function getPrintOrderListMainShop(int $base_info_id): array
    {
        $qb = $this->createQueryBuilder('o');
        $qb->select([
            'o.id AS order_id',
            'o.order_date AS order_date',
            'o.order_number AS order_number',
            "CONCAT(o.kana01, ' ', o.kana02) AS name_kana",
            "CONCAT(o.name01, ' ', o.name02) AS name",
            'o.payment_total AS payment_total',
            'IDENTITY(o.OrderStatus) AS status',
            "'□' AS expensive",
            'o.smaregi_code AS smaregi_code',
            'CASE WHEN o.message IS NOT NULL THEN true ELSE false END AS hasMessage',
        ])
            ->join('\Eccube\Entity\Shipping', 's', 'WITH', 's.Order = o')
            ->where('IDENTITY(o.baseInfo) = :baseInfoId')
            ->andWhere('o.order_number IS NOT NULL')
            ->andWhere($qb->expr()->orX(
                $qb->expr()->andX(
                    's.Delivery = :otc',
                    'o.OrderStatus = :orderNew'
                ),
                $qb->expr()->andX(
                    's.Delivery = :smoothOtc',
                    'o.OrderStatus <> :processing',
                    'o.Payment IN (:payments)',
                    'o.confirmDate IS NULL',
                    'o.commitDate IS NULL',
                    'o.shippingDate IS NULL',
                    'o.cancel_date IS NULL',
                    'o.receiptDate IS NULL',
                    'o.otc_rsv_date IS NULL',
                    'o.smaregi_code IS NOT NULL'
                ),
                'o.browser_print_flg = true'
            ))
            ->setParameter('baseInfoId', $base_info_id)
            ->setParameter('otc', Delivery::OTC)
            ->setParameter('orderNew', OrderStatus::NEW)
            ->setParameter('smoothOtc', Delivery::SMOOTH_OTC)
            ->setParameter('processing', OrderStatus::PROCESSING)
            ->setParameter('payments', [Payment::EC_CREDIT, Payment::EC_SPLINKS_CREDIT, Payment::EC_PAYMENT_NONE])
            ->groupBy('o.id')
            ->setMaxResults(10)
        ;

        return $qb->getQuery()->getResult();
```

ec-cube-enterprise 支店向け印刷対象取得も payment_total のみを返す: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1550-1607`
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
```
- ベース実装(pf-api)では、印刷XML生成時に受注の配送を取得し、配送IDが DtbDelivery::SMOOTH_OTC の場合は $paymentTotal を「スムーズ店頭受取」に置換してから合計金額欄へ出力している。

ベース実装 pf-api は SMOOTH_OTC の場合に合計金額欄を文言へ置換する: `pf-api/src/Controller/Admin/OrderController.php:134-144`
```php
    private function getPrintData(array $order, string $uri) : string
    {
        $orderDate = !is_null($order['order_date']) ? $order['order_date']->format('Y/m/d H:i') : '';
        $paymentTotal = '\\' . number_format($order['payment_total']);
        $waitingNumberEntity = $this->getDoctrine()->getRepository(DtbWaitingNumber::class)->findOneByOrderId($order['order_id']);
        $waitingNumber = $waitingNumberEntity ? $waitingNumberEntity->getWaitingNumber() : '';
        $shipping = $this->getDoctrine()->getRepository(DtbShipping::class)->findOneByOrder($order['order_id']);
        $deliveryId = $shipping ? $shipping->getDelivery()->getDeliveryId() : null;
        if ($deliveryId === DtbDelivery::SMOOTH_OTC) {
            $paymentTotal = 'スムーズ店頭受取';
        }
```

# 根拠
- 設計：
  - A05-01 は pf-api の注文印刷処理を確認値とする: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1012-1014`
  - GetRequest でスムーズ店頭受取の場合は合計金額欄を文言にする: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1043-1044`
  - DBカラム定義でも payment_total はスムーズ店頭受取時に文言へ置換すると定義: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1104-1107`
- ec-cube-enterprise：
  - 印刷XML生成で payment_total をそのまま出力: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:71-129`
  - 本店向け取得は smoothOtc 条件を持つが印字データに delivery_id を返さない: `ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1493-1540`
- ベース実装：
  - SMOOTH_OTC の場合に paymentTotal をスムーズ店頭受取へ置換: `pf-api/src/Controller/Admin/OrderController.php:134-144`

# 確認メモ
- 確認コマンド: `rg -n "スムーズ店頭受取|合計金額|payment_total|GetRequest|印刷対象|注文印刷|A05-01|order/print|order/prints" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html`
- 確認コマンド: `rg -n "SMOOTH|smooth|スムーズ|delivery|payment_total|店頭受取|is_main_shop|getPrintOrderListMainShop|getDirectPrintOrderList" pf-api/src/Controller/Admin/OrderController.php pf-api/src/Repository ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php`
- 確認コマンド: `rg -n "paymentTotal|SMOOTH_OTC|スムーズ店頭受取|DtbDelivery|findOneByOrder" pf-api/src/Controller/Admin/OrderController.php`
- 確認コマンド: `rg -n "paymentTotal|SMOOTH_OTC|スムーズ店頭受取|Delivery::SMOOTH_OTC|payment_total" ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php`
- 設計HTMLは GetRequest の印刷情報生成で、配送がスムーズ店頭受取の場合に合計金額欄を「スムーズ店頭受取」とする要求を明記している。
- pf-api は DtbShipping から配送IDを取得し、DtbDelivery::SMOOTH_OTC の場合に $paymentTotal を文言へ置換している。
- ec-cube-enterprise の getPrintData() は payment_total をそのまま合計金額欄へ出力し、配送方法を参照していない。

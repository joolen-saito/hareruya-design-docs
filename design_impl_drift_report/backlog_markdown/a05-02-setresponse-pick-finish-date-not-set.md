/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：注文印刷_該当受注のステータスを印刷済みに変更
課題カテゴリ：実装漏れ
課題：SetResponseで受注をピック中へ更新してもpick_finish_dateが設定されない
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. A05-02 の印刷完了通知として、ブラウザ印刷フラグが立っていない受注IDを含む ResponseFile XML を用意する
2. ec-cube-enterprise の注文印刷API POST http://localhost:8080/api/order/prints/direct/{base_info_id} に ConnectionType=SetResponse と ResponseFile を指定して呼び出す
3. 対象受注の dtb_order.pick_finish_date が設定されるか確認する

# 期待される挙動【必須】
- SetResponse でブラウザ印刷フラグが立っていない受注をピック中へ更新する際、dtb_order.pick_finish_date を設定する
- dtb_order.picking_date・pick_finish_date は、ピック中へ更新する際に設定対象の列として扱う

# 現在の挙動【必須】
- ec-cube-enterprise では、SetResponse の更新処理でブラウザ印刷フラグが立っていない場合に受注ステータスをピック中へ更新する。その後、本店は `setConfirmDate(new \DateTime())`、支店は `setPickingDate(new \DateTime())` を呼び出すが、`setPickFinishDate()` はこのフロー内で呼ばれない。

ec-cube-enterprise SetResponse 更新処理は setPickFinishDate を呼ばない: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87-100`
```php
                if ($Order->isBrowserPrintFlg()) {
                    $Order->setBrowserPrintFlg(false);
                } else {
                    $Order->setOrderStatus($pickingStatus);
                    if ($BaseInfo->isMainShop()) {
                        // 本店の場合、注文確定日を更新
                        $Order->setConfirmDate(new \DateTime());
                    } else {
                        // 支店の場合、ピック開始日を更新
                        $Order->setPickingDate(new \DateTime());
                    }
                }
                $this->entityManager->persist($Order);
                $this->entityManager->flush();
```

ec-cube-enterprise Order エンティティには pick_finish_date と setPickFinishDate が存在する: `ec-cube-enterprise/src/Eccube/Entity/Order.php:661-665`
```php
        #[ORM\Column(name: 'picking_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック開始日'])]
        private ?\DateTime $picking_date = null;

        #[ORM\Column(name: 'pick_finish_date', type: Types::DATETIMETZ_MUTABLE, nullable: true, options: ['comment' => 'ピック完了日'])]
        private ?\DateTime $pick_finish_date = null;
```

ec-cube-enterprise Order エンティティの setPickFinishDate セッター: `ec-cube-enterprise/src/Eccube/Entity/Order.php:1839-1848`
```php
        public function getPickFinishDate(): ?\DateTime
        {
            return $this->pick_finish_date;
        }

        public function setPickFinishDate(?\DateTime $pick_finish_date): Order
        {
            $this->pick_finish_date = $pick_finish_date;

            return $this;
```
- ベース実装(pf-api)は旧スキーマのため `pick_finish_date` を持たず、印刷完了時は受注ステータスを `ORDER_PICKING` に更新し、補助表 `orderSub` の `confirmDate` を設定している。設計HTMLでは、この旧補助表の印刷・ピック状態を ec-cube-enterprise の `dtb_order.picking_date`・`pick_finish_date`・`browser_print_flg` へ移す前提が示されている。

ベース実装 pf-api は ORDER_PICKING と orderSub confirmDate を更新する: `pf-api/src/Controller/Admin/OrderController.php:116-123`
```php
            $orderSub = $order->getOrderSub();
            if ($orderSub->getBrowserPrintFlg()) {
                $orderSub->setBrowserPrintFlg(false);
            } else {
                $order->setStatus(MtbOrderStatus::ORDER_PICKING);
                $orderSub->setConfirmDate(new \DateTime());
            }
            $em->flush();
```

# 根拠
- 設計：
  - 現行補助表から移行先の picking_date・pick_finish_date・browser_print_flg へ状態を保持する前提: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1028`
  - SetResponse でピック中へ更新する際に picking_date・pick_finish_date を設定する: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1106-1107`
- ec-cube-enterprise：
  - SetResponse 更新処理は confirmDate または pickingDate のみを設定する: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87-100`
  - pick_finish_date カラムとセッターは存在する: `ec-cube-enterprise/src/Eccube/Entity/Order.php:661-665`
  - setPickFinishDate セッター: `ec-cube-enterprise/src/Eccube/Entity/Order.php:1839-1848`
- ベース実装：
  - 旧実装は ORDER_PICKING と補助表 confirmDate を設定する: `pf-api/src/Controller/Admin/OrderController.php:116-123`

# 確認メモ
- 確認コマンド: `rg -n "picking_date|pick_finish_date|confirm_date|確定日時|ピック中|SetResponse|ブラウザ印刷フラグ|ステータスをピック中|setPickingDate|setPickFinishDate|setConfirmDate|UpdatePrintedOrderStatus|ResponseFile|PROCESSING" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html hareruya-design-docs/design_impl_drift_report/findings/a05-02_0505_sheet-4_sheet.json ec-cube-enterprise/src/Eccube pf-api/src`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php | sed -n '1,135p'`
- 確認コマンド: `nl -ba pf-api/src/Controller/Admin/OrderController.php | sed -n '88,130p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '648,668p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/Order.php | sed -n '1796,1848p'`
- 設計HTMLは confirm_date と picking_date の扱いに揺れがあるため、本店の picking_date 未設定や支店の confirm_date 未設定は本項目では扱わない。
- gpt-5.5 high の批判的レビューでは、pick_finish_date は設計上 SetResponse の設定対象として明示され、enterprise 実装フローに setPickFinishDate 呼び出しがないため、この範囲なら VERIFIED と判定された。
- pf-api は旧スキーマのため pick_finish_date を持たないが、設計HTMLでは旧補助表の状態を enterprise の dtb_order.picking_date・pick_finish_date・browser_print_flg に移す前提が示されている。

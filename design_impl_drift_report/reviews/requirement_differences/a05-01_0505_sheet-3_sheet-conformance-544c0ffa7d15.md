# a05-01_0505_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json#a05-01_0505_sheet-3_sheet-conformance-544c0ffa7d15`
- 機能: A05-01 A05-01 注文印刷_印刷情報をプリンタへ送信
- 観点: ⑦要求網羅・実装違い

## 要旨
設計はXML生成前に全印刷対象でスマレジコードの存在を確認し無ければ何もしないとするが、実装は一部の抽出ブランチにしか smaregi_code IS NOT NULL 条件がなく、XML生成前の存在確認も無いため空バーコードが生成され得る。

## 判定理由
設計(行879-880)は『バーコードが印刷されない問題を防ぐため、注文データをXML形式にする前に受注データにスマレジの商品コードが存在するか確認し、存在しない場合は何もしない』と全対象に対する事前確認を規定。実装では getPrintOrderListMainShop の (s.Delivery=:otc AND OrderStatus=:orderNew) ブランチ(行1572-1575)と browser_print_flg ブランチ(行1588)に smaregi_code 条件が無い。getDirectPrintOrderList でも browser_print_flg=true ブランチ(行1648-1650)に smaregi_code 条件が無い(smaregi_code IS NOT NULL は smoothOtc ブランチ/支店OTCブランチのみ)。さらに OrderDirectPrintAction にはXML生成前のスマレジコード存在確認ガードが無く(rg で smaregi は行78の埋め込み用取得と行135のバーコード出力のみ)、$smaregiCode をそのまま <barcode> に出力するため、空バーコードの印刷XMLが生成され得る。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:879-880` — 設計 スマレジコード事前確認

```html
            <div class="doc-bullet" style="--lv:2"><span class="doc-marker">・</span><span>バーコードが印刷されていない問題が発生しないようにするため、注文データをXML形式にする前に受注データにスマレジの商品コードが存在するかどうか確認する</span></div>
            <p class="doc-p" style="--lv:3">スマレジの商品コードが存在しない場合はスマレジコードが採番されていない可能性があるため何もしない</p>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1571-1589` — 本店クエリ: OTC-NEWとbrowser_print_flgブランチに smaregi 条件なし

```php
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
```

`ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php:1646-1651` — 支店クエリ: browser_print_flgブランチに smaregi 条件なし

```php
                FROM dtb_order o
                JOIN dtb_shipping s ON s.order_id = o.id
                WHERE o.base_info_id = :baseInfoId
                    AND o.order_number IS NOT NULL
                    AND o.browser_print_flg = true
                GROUP BY o.id
```

`ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:135-135` — XML生成前ガードなく smaregi_code を直接バーコード出力

```php
                  <barcode type="jan13" hri="below" font="font_b" width="2" height="50">{$smaregiCode}</barcode>
```

## 不在確認コマンド

- `rg -n 'smaregi' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。設計(HTML行879-880)は『XML形式にする前に受注データにスマレジの商品コードが存在するか確認し、存在しない場合は何もしない』と全対象への事前確認を規定。実装を精査: getPrintOrderListMainShop の (otc AND orderNew) 分岐と browser_print_flg=true 分岐に smaregi_code 条件なし(smaregi_code IS NOT NULL は smoothOtc 条件群のみ)。getDirectPrintOrderList も browser_print_flg=true UNION 分岐に smaregi_code 条件なし。OrderDirectPrintAction::getPrintData は取得済み smaregi_code を htmlspecialchars して <barcode> に無ガードで直接出力し、XML生成前の存在確認・空時スキップが存在しない。反証を狙って探した findOtcOrdersAwaitingSmaregiSync(OrderRepository:828) は逆に OTC受注が smaregi 同期待ちで smaregi_code 未採番であり得ることを示し、指摘を補強した。よって空バーコードXMLが生成され得る。指摘は維持。

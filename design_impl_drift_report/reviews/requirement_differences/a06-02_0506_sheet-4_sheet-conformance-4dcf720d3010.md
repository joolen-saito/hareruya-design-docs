# a06-02_0506_sheet-4_sheet 実装漏れ

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-02_0506_sheet-4_sheet.json#a06-02_0506_sheet-4_sheet-conformance-4dcf720d3010`
- 機能: A06-02 A06-02 店頭買取情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
『店舗が紐づかない場合は絞り込まず一律に返す』分岐が無く、実装は常に会員の baseInfo で絞り込み、店舗が空なら空配列を返す。

## 判定理由
設計は『認証した管理者会員に店舗が紐づく場合はその店舗の受注に絞り込み、紐づかない場合は店舗による絞り込みを行わず査定対象の受注を一律に返す』とする。実装は Controller.php:77 で常に $shopId = $Member->getBaseInfo()->getId() を取得し、Repository.getOtcBuyOrdersByShopIdAndStatus は先頭（:1001）で empty($shopId) なら [] を返し、:1047 で常に baseInfo.id = :shopId を付与する。すなわち店舗なし時に無絞り込みで全件返す分岐は存在しない（空配列になる）。無絞り込み経路や shopId=null 分岐を検索したが見つからない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1180-1180` — 設計要求（店舗紐づきなし→無絞り込み）

```html
          <div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>認証方式</td><td><code>jwt-token</code>ヘッダのJWTを検証し、ペイロードの利用者IDから管理者会員を引く。署名方式はHS256。</td></tr><tr><td>認証失敗時</td><td>ヘッダ欠落・署名不正・該当する管理者会員なしのいずれも認証拒否（HTTP 401）とする。</td></tr><tr><td>認可</td><td>呼び出し可能なクライアントは買取アプリ。認証した管理者会員に店舗が紐づく場合はその店舗の受注に絞り込み、紐づかない場合は店舗による絞り込みを行わず査定対象の受注を一律に返す。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:77-77` — 常に店舗IDを取得

```php
        $shopId = $Member->getBaseInfo()->getId();
```

無絞り込み分岐なし
`ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1001-1050` — 店舗空なら空配列＋常に絞り込み

```php
        if (empty($shopId) || empty($statusIds)) {
            return [];
        }

        $qb = $this->createQueryBuilder('otcBuyOrder')
            ->join('otcBuyOrder.OtcBuyOrderStatus', 'otcBuyOrderStatus', Join::WITH, 'otcBuyOrderStatus.id IN (:statusIds)')
            ->join('otcBuyOrder.Job', 'job')
            ->leftJoin('otcBuyOrder.Member', 'm')
            ->join('otcBuyOrder.Country', 'country')
            ->leftJoin('otcBuyOrder.Pref', 'pref')
            ->leftJoin('otcBuyOrder.Identification', 'identification')
            ->leftJoin(
                'otcBuyOrder.QualifiedInvoiceIssuerAccount',
                'qualifiedInvoiceIssuerAccount',
            )
            ->leftJoin('otcBuyOrder.BaseInfo', 'baseInfo')
            ->select(
                'otcBuyOrder.id',
                'otcBuyOrder.assessmentId',
                'otcBuyOrder.applyDate',
                'otcBuyOrder.firstName',
                'otcBuyOrder.lastName',
                'otcBuyOrder.birth',
                'otcBuyOrder.telNo',
                'otcBuyOrder.zipcode',
                'otcBuyOrder.freeComment',
                'job.name as jobName',
                'm.name as memberName',
                'otcBuyOrderStatus.id as otcOrderStatusId',
                'otcBuyOrder.returnSupply',
                'otcBuyOrder.callFlg',
                'otcBuyOrder.adultFlg',
                'otcBuyOrder.playingFlg',
                'otcBuyOrder.addr01',
                'otcBuyOrder.addr02',
                'otcBuyOrder.addr03',
                'country.id as countryId',
                'country.name as countryName',
                'pref.name as prefName',
                'otcBuyOrderStatus.name as otcOrderStatusName',
                'identification.id as identificationId',
                'otcBuyOrder.qualifiedInvoiceIssuerFlg',
                'otcBuyOrder.qualifiedInvoiceIssuerConfirmationFlg',
                'qualifiedInvoiceIssuerAccount.qualifiedInvoiceIssuerCode',
            )
            ->orderBy('otcBuyOrder.id', 'ASC');
        $qb->where('baseInfo.id = :shopId')
            ->andWhere('otcBuyOrderStatus.id IN (:statusIds)')
            ->setParameter('shopId', $shopId)
            ->setParameter('statusIds', $statusIds);
```

## 不在確認コマンド

- `rg -n "getBaseInfo|shopId" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php`
- `rg -n "empty\(\$shopId\)|shopId" /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php`

## 反証結果

反証を試みた結果、指摘は覆らなかった。Repository を実読。getOtcBuyOrdersByShopIdAndStatus は :998 で int $shopId 必須、:1001 で empty($shopId) なら [] を返し、:1047 で常に where('baseInfo.id = :shopId') を付与。Controller.php:77 は常に $Member->getBaseInfo()->getId() を渡す（null分岐無し、そのまま->getId()呼び出し）。店舗が紐づかない場合に絞り込みを外して全査定対象を一律返す経路は実装に存在しない（存在すれば空配列でなく全件になるはずだが、コード上は空配列固定）。指摘は維持。

# a05-01_0505_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: medium）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json#a05-01-0505-sheet-3-sheet-2f45bf8cba-07`
- 機能: A05-01 A05-01 注文印刷_印刷情報をプリンタへ送信
- 観点: ④DBカラム・DB操作

## 要旨
SetResponse でブラウザ印刷フラグが立たない場合の日時列設定が、設計に無い本店/支店分岐で異なり(本店 confirm_date・支店 picking_date)、設計が挙げる pick_finish_date は一切設定されない。

## 判定理由
設計処理フロー(行1046)は『立っていない場合は受注のステータスをピック中へ更新し、補助情報の確定日時に現在時刻を設定』とし、DBカラム節(行1107)は picking_date・pick_finish_date を『ピック中へ更新する際に設定』、confirm_date を『ステータス更新時に現在時刻を設定』とする。実装 UpdatePrintedOrderStatusAction.php:87-97 は setOrderStatus(picking) 後に BaseInfo->isMainShop() で分岐し、本店 setConfirmDate(行93)・支店 setPickingDate(行96) を設定。pick_finish_date は print系アクションに rg しても setPickFinishDate 相当が無く一切設定されない。設計に無い本店/支店分岐があり、支店では confirm_date を設定せず、pick_finish_date も未設定で、設定列が設計と一致しない。なお設計自体が処理フロー(確定日時)とDBカラム(picking_date/pick_finish_date)で列指定に揺れがある点は留意。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1046-1046` — 設計 ピック中更新・確定日時

```html
          <ol><li>リクエストの<code>ConnectionType</code>を読み、値が<code>SetResponse</code>であることを判定する。</li><li>POSTで受け取った<code>ResponseFile</code>のXMLを解析する。解析に失敗した場合は内容とエラーを記録して更新を行わずに戻る。</li><li>XMLの直接印刷結果が偽、または印刷結果要素が1件も無い場合は内容を記録して更新を行わずに戻る。</li><li>印刷結果要素ごとに、印刷ジョブIDの先頭部分から受注IDを取り出し、対象受注を特定する。受注が見つからない場合はエラーを記録して次の要素へ進む。</li><li>対象受注の補助情報のブラウザ印刷フラグが立っている場合は、そのフラグを倒すだけに留める。立っていない場合は受注のステータスをピック中へ更新し、補助情報の確定日時に現在時刻を設定する。</li><li>各受注の更新を反映する。</li><li>空の本文（HTTP 200、<code>text/xml</code>）を返す。</li></ol>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdatePrintedOrderStatusAction.php:87-97` — 本店/支店で異なる日時列を設定・pick_finish_date未設定

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
```

## 不在確認コマンド

- `rg -n 'pick_finish|setPickFinishDate|PickFinish' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/`

## 反証結果

反証を試みた結果、指摘は覆らなかった。UpdatePrintedOrderStatusAction.php:86-97 を実読。ブラウザ印刷フラグが立たない分岐で setOrderStatus(PICKING) 後、BaseInfo->isMainShop() で本店 setConfirmDate(new DateTime())・支店 setPickingDate(new DateTime()) に分岐。pick_finish_date は本アクションで一切設定されない(Entity/Order.php:1881 に setPickFinishDate は存在するが Service/Admin/Order 配下の print 系から呼ばれない)。設計DBカラム(行1107)は『picking_date・pick_finish_date を SetResponse でピック中へ更新する際に設定する』と両列を要求するが、いずれの経路でも pick_finish_date が未設定のため、どの読み方でも設計要求を完全には満たさない。加えて設計に無い本店/支店分岐で確定列が分岐(支店は confirm_date 未設定)。指摘は維持(設計自体の flow/DBカラム間の列指定の揺れは finding も明記済み)。

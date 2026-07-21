# a06-03_0506_sheet-5_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-03_0506_sheet-5_sheet.json#a06-03_0506_sheet-5_sheet-conformance-386ab112caaa`
- 機能: A06-03 A06-03 店頭買取情報更新
- 観点: ⑦要求網羅・実装違い

## 要旨
エラー応答契約（400/401/404本文なし・order_statusマスタ存在検証と指定メッセージ）が実装と乖離している。

## 判定理由
設計(1537,1556)は入力不正=HTTP400・全メッセージをerrors配列で返し、401/404は本文を持たず、order_statusは店頭買取ステータスマスタに存在するIDで存在しない場合『MtbOtcBuyOrderStatusに{指定ID}が見つかりません。』と規定。実装ではControllerが#[MapRequestPayload]（validationFailedStatusCode未指定=Symfony既定422）でDTO検証を委譲するためDTO制約違反時に422を返し得る。ExceptionListenerのisAppApi分岐(72,136-139)はApp API例外を常に{code, errors}のJSON本文で返し、401は'認証エラー'、404はメッセージを本文に載せるため『本文を持たない』設計と矛盾。order_statusはマスタ存在ではなくAssert\Choice(ASSESSMENT_COMPLETED_STATUSES=成立/キャンセル/経理払出し待ちの3値)へ絞り、メッセージも'order_status is invalid'で設計文言と不一致。いずれも別ルート・別クラスで設計どおり実現している箇所は見当たらなかった。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1537-1537` — 設計要求(応答/検証)

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>404</td><td>受注IDに該当する店頭買取受注が無い</td><td>該当なし（本文を持たない）</td></tr><tr><td>400</td><td>ステータス未指定</td><td><code>{code, errors}</code>（<code>errors</code>に「ステータスを選択してください。」を含む）</td></tr><tr><td>400</td><td>ステータスIDが店頭買取ステータスマスタに存在しない</td><td><code>{code, errors}</code>（<code>errors</code>に「MtbOtcBuyOrderStatusに{指定ID}が見つかりません。」を含む）</td></tr><tr><td>400</td><td>明細が未指定または空</td><td><code>{code, errors}</code>（<code>errors</code>に「1つ以上の商品を選んでください。」を含む）</td></tr><tr><td>400</td><td>明細の商品名が未入力</td><td><code>{code, errors}</code>（<code>errors</code>に商品名必須の検証メッセージを含む）</td></tr><tr><td>400</td><td>明細の商品名が最大長超過</td><td><code>{code, errors}</code>（<code>errors</code>に「商品名は、 65535 以下で入力してください。」を含む）</td></tr><tr><td>400</td><td>明細の商品規格ID・数量・単価・販売価格・部門IDが整数でない</td><td><code>{code, errors}</code>（<code>errors</code>に該当項目の整数形式メッセージを含む）</td></tr><tr><td>500</td><td>削除・登録・保存処理中の例外</td><td>共通例外処理に委ねる</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:130-130` — MapRequestPayload委譲(400ではなく422)

```php
    public function updateOtcBuyOrder(int $id, #[MapRequestPayload] UpdateOtcBuyOrderDto $updateOtcBuyOrderDto): JsonResponse
```

`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136-139` — 401/404も本文({code,errors})を返す

```php
            $response = new JsonResponse([
                'code' => $statusCode,
                'errors' => $errors,
            ], $statusCode);
```

`ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:35-35` — order_statusはChoice制約かつメッセージ相違

```php
        #[Assert\Choice(choices: MtbOtcBuyOrderStatus::ASSESSMENT_COMPLETED_STATUSES, message: 'order_status is invalid')]
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。引用・別実装・要求読みの3観点で崩せず維持。(1)Controller:130 は `#[MapRequestPayload] UpdateOtcBuyOrderDto`（引数なし=validationFailedStatusCode既定422）で、DTO制約違反時に設計(1537,1556)の HTTP400 ではなく422を返し得る。(2)ExceptionListener.php:136-139 `new JsonResponse(['code'=>$statusCode,'errors'=>$errors],$statusCode)` は isAppApi()経路で例外を必ずJSON本文化し、401→['認証エラー']、404→メッセージ本文を返す。設計は401/404を『本文を持たない』と明記(1537)＝矛盾。別ルート/別Listenerで本文なし401/404を返す経路は無し。(3)UpdateOtcBuyOrderDto.php:35 の `Assert\Choice(choices: MtbOtcBuyOrderStatus::ASSESSMENT_COMPLETED_STATUSES, message:'order_status is invalid')` は許可値を{1,2,10}の3値のみに限定。設計(1531,1556)は『店頭買取ステータスマスタに存在するID(全14値)』で、不在時メッセージは『MtbOtcBuyOrderStatusに{指定ID}が見つかりません。』。Action.php の entityManager->find→'Invalid order status id' も設計文言と不一致で、しかも Choice を通過しないと到達しない。値集合・メッセージ・HTTPコード・本文有無の全てで乖離を実コードで確認。指摘維持。

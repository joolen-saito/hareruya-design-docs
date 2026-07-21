# a07-02_0507_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-02_0507_sheet-4_sheet.json#a07-02_0507_sheet-4_sheet-conformance-1ab3e04d3312`
- 機能: A07-02 A07-02 ネット買取受注一覧取得
- 観点: ⑦要求網羅・実装違い

## 要旨
GET /admin/buyOrders.json の成功レスポンスが設計スキーマと不一致（ID文字列化・日時非ISO8601・null空文字化）。

## 判定理由
設計(1142,1165行)は netBuyOrderId/netOrderStatusId を integer、applyDate を ISO8601、freeComment/memberName を未設定時 null、serialize_null 有効と定義。実装 BuyOrderController::getProductArrivalBuyOrders は array_map で手組みの配列を new JsonResponse($response) でそのまま返しており、(1) netBuyOrderId=(string)$buyOrder['id']、(2) netOrderStatusId=(string)$buyOrder['buyOrderStatusId'] と文字列化、(3) applyDate=->format('Y/m/d H:i:s') と非ISO8601形式、(4) freeComment=$buyOrder['memo'] ?? ''、memberName=$buyOrder['memberName'] ?? '' と null を空文字へ置換している。camelCase/ISO8601/serialize_null を適用する応答整形サービスを経由していない。findToAssessBuyOrders リポジトリや別ルートに正規化処理が無いか確認したが、当該GETレスポンスの整形はこのコントローラ内で完結しており別経路での契約一致は無い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:1142-1165` — 設計要求（成功レスポンス仕様・応答整形）

```html
          <div class="table-wrap"><table><thead><tr><th>フィールド</th><th>型</th><th>説明</th></tr></thead><tbody><tr><td>（応答本体）</td><td>array</td><td>査定対象のネット買取受注の配列。該当が無い場合は空配列。</td></tr><tr><td><code>netBuyOrderId</code></td><td>integer</td><td>ネット買取受注ID。</td></tr><tr><td><code>applyDate</code></td><td>string</td><td>申込日時。ISO8601形式の日時文字列。</td></tr><tr><td><code>freeComment</code></td><td>string</td><td>受注に付与されたフリーコメント。未設定の場合はnull。</td></tr><tr><td><code>memberName</code></td><td>string</td><td>申込者を登録した会員名。紐づく会員が無い場合はnull。</td></tr><tr><td><code>netOrderStatusId</code></td><td>integer</td><td>買取受注ステータスのID。</td></tr><tr><td><code>customerInfo</code></td><td>object</td><td>申込者情報のオブジェクト。</td></tr><tr><td><code>customerInfo.firstName</code></td><td>string</td><td>申込者の名。</td></tr><tr><td><code>customerInfo.lastName</code></td><td>string</td><td>申込者の姓。</td></tr><tr><td><code>customerInfo.telNo</code></td><td>string</td><td>申込者の電話番号。</td></tr><tr><td><code>customerInfo.zipcode</code></td><td>string</td><td>申込者の郵便番号。</td></tr><tr><td><code>customerInfo.address</code></td><td>string</td><td>申込者の住所。都道府県名・住所1・住所2を半角空白区切りで連結した文字列。</td></tr></tbody></table></div>
          <h3 id="function-design-a07-02-a07-02_api_online_purchase_buy_order_list-レスポンス-失敗">レスポンス（失敗）</h3>
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>500</td><td>受注取得・整形処理中の例外</td><td>共通例外処理に委ねる</td></tr></tbody></table></div>
          <h3 id="function-design-a07-02-a07-02_api_online_purchase_buy_order_list-サンプルレスポンス">サンプルレスポンス</h3>
          <p>成功時の応答例（実装確認値に基づく代表値。個人情報は最小限の代表値とする）。</p>
          <pre><code class="language-json">[
            {
              "netBuyOrderId": 1001,
              "applyDate": "2026-06-01T10:30:00+09:00",
              "freeComment": null,
              "memberName": "買取担当 太郎",
              "netOrderStatusId": 2,
              "customerInfo": {
                "firstName": "一郎",
                "lastName": "山田",
                "telNo": "0312345678",
                "zipcode": "1000001",
                "address": "東京都 千代田区千代田 1-1"
              }
            }
          ]</code></pre>
          <h3 id="function-design-a07-02-a07-02_api_online_purchase_buy_order_list-副作用">副作用</h3>
          <p>無し（参照のみ）。</p>
          <p>応答はJSON応答整形を経て返す。プロパティはcamelCase、日時はISO8601、<code>serialize_null</code>は有効とする。</p>
```

## ec-cube-enterprise 実装
整形サービスを経由せず配列を直接JsonResponse化
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:71-87` — 実装（レスポンス手組み）

```php
            return [
                'netBuyOrderId' => (string) $buyOrder['id'],
                'applyDate' => $buyOrder['orderDate']->format('Y/m/d H:i:s'),
                'freeComment' => $buyOrder['memo'] ?? '',
                'memberName' => $buyOrder['memberName'] ?? '',
                'netOrderStatusId' => (string) $buyOrder['buyOrderStatusId'],
                'customerInfo' => [
                    'firstName' => $buyOrder['firstName'],
                    'lastName' => $buyOrder['lastName'],
                    'telNo' => $buyOrder['telNo'] ?? '',
                    'zipcode' => $buyOrder['zipcode'],
                    'address' => $address,
                ],
            ];
        }, $buyOrders);

        return new JsonResponse($response);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず、指摘は維持。(1)引用検証: BuyOrderController.php:71-87 を実読し、netBuyOrderId=(string)$buyOrder['id']、applyDate=$buyOrder['orderDate']->format('Y/m/d H:i:s')、freeComment=$buyOrder['memo'] ?? ''、memberName=$buyOrder['memberName'] ?? ''、netOrderStatusId=(string)$buyOrder['buyOrderStatusId']、return new JsonResponse($response) を全て確認。implEvidenceは正確。(2)設計検証: 設計HTML 1142行の応答フィールド表が netBuyOrderId/netOrderStatusId=integer、applyDate=ISO8601、freeComment/memberName=未設定時null と明記、1165行が『camelCase・日時ISO8601・serialize_null有効』と明記、サンプル(1147-1162行)も netBuyOrderId:1001(整数)・applyDate:"2026-06-01T10:30:00+09:00"(ISO8601)・freeComment:null を提示。実装は文字列キャスト・非ISO日付・null→空文字で全項目不一致。(3)別実装検証: rgで /admin/buyOrders.json GET のハンドラは当該1件のみ。JsonResponse($response)は既に(string)キャスト・format()済みの配列を出力するため、後段のkernel.responseやserializerがあっても文字列→整数やISO再変換は不可能で契約一致は成立し得ない。(4)設計除外検証: 『現行踏襲』『pf-apiを正とする』の注記(1103-1104行)はあるが、設計は型・ISO8601・serialize_nullを明示契約として定義しており除外扱いではない。ec-cube-enterprise実装は設計スキーマから明確に乖離。

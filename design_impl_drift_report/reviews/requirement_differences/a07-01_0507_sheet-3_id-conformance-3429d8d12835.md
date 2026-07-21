# a07-01_0507_sheet-3_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-01_0507_sheet-3_id.json#a07-01_0507_sheet-3_id-conformance-3429d8d12835`
- 機能: A07-01 A07-01 まとめて買取商品IDの取得
- 観点: ⑦要求網羅・実装違い

## 要旨
まとめ買取商品ID未設定時、設計はHTTP 500(例外)を要求するが、実装は空文字列をHTTP 200で正常応答している。

## 判定理由
設計書(sheet-3, 968行/980行/993行)では、まとめ買取商品IDの設定がオプションマスタに存在しない場合は『設定値の参照で例外となり、共通例外処理に委ねる（HTTP 500相当）』『設定が無い場合は値を取得できず処理が失敗する』と明記。一方、OptionController::getBulkPurchaseId (line 38-44) は findOneBy が null を返した際に `$Option?->getOptionValue() ?? ''` で空文字列を作り、`new JsonResponse($value)`（デフォルトHTTP 200）で返しており、例外を発生させない。別経路の有無を確認するため rg で optionBulkPurchaseId / api_admin_option_bulk_purchase_id / getBulkPurchaseId / BulkPurchaseIdService を検索したが、当該ルートを処理するのはこの OptionController のみで、未設定時に例外を投げる BulkPurchaseIdService は本APIからは使用されていない。よって実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:968-968` — 設計要求（エラー処理・レスポンス失敗）

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>トークン欠落・署名不正・該当する管理者会員なし</td><td>認証拒否（本文を持たない）</td></tr><tr><td>500</td><td>まとめ買取商品IDの設定がオプションマスタに存在しない（設定値の参照で例外）</td><td>共通例外処理に委ねる</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
$Option が null（未設定）でも例外化せず空文字列を JsonResponse（デフォルト200）で返す
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:38-44` — 実装（未設定を空文字列でHTTP 200応答）

```php
        $Option = $this->mtbOptionRepository->findOneBy([
            'option_key' => MtbOption::BULK_PURCHASE_ID,
        ]);

        $value = $Option?->getOptionValue() ?? '';

        return new JsonResponse($value);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが崩せず、指摘は維持。(1)別実装なし: ルート /admin/optionBulkPurchaseId.json (name=api_admin_option_bulk_purchase_id) を処理するのは OptionController::getBulkPurchaseId のみ。rg で optionBulkPurchaseId/BULK_PURCHASE_ID/BulkPurchaseIdService/getBulkPurchaseId を横断検索。未設定時に例外を投げる BulkPurchaseIdService (src/Eccube/Service/Purchase/BulkPurchaseIdService.php) は存在するが、その利用元は Front/Purchase/PurchaseController と Admin/Purchase/PurchaseSearchAction のみで、本APIコントローラは同サービスを一切呼ばず MtbOptionRepository を直接参照している。EventSubscriber等で空応答を500化する経路も無し。(2)引用の正しさ: 実装 line42 `$value = $Option?->getOptionValue() ?? ''`、line44 `return new JsonResponse($value)`(デフォルトHTTP200) を実ファイルで確認、引用は正確。設計側もHTML内『エラー処理』表『まとめ買取商品IDの設定が無い→設定値の参照で例外となり、共通例外処理に委ねる（HTTP 500相当）』、『レスポンス（失敗）』表の500行、『データ整合性』の『設定が無い場合は値を取得できず処理が失敗する』の3箇所で一貫して500/失敗を要求しており引用は正確。(3)設計側除外なし: Ph2/対象外/現行踏襲等の注記は近傍に無く、むしろ明示的に500を要求。(4)要求の読み違いなし: 設計は本API（同一ルート・同一キー MtbOption::BULK_PURCHASE_ID）に掛かっており対象一致。(5)決定的裏付け: 実装テスト testGetBulkPurchaseIdWhenNotFound (OptionControllerTest.php:122-147) が未設定時に `assertSame(Response::HTTP_OK,...)` と `assertSame(json_encode(''),...)` を明記し、HTTP200+空文字応答という設計違反挙動を仕様として固定化している。実装違いは事実。

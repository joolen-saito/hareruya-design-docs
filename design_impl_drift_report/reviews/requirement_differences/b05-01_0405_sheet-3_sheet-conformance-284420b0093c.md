# b05-01_0405_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/b05-01_0405_sheet-3_sheet.json#b05-01_0405_sheet-3_sheet-conformance-284420b0093c`
- 機能: B05-01 B05-01 注文番号登録
- 観点: ⑦要求網羅・実装違い

## 要旨
親バッチのスマレジ用商品コード採番が注文番号を8桁0埋めせず末尾6桁を切り出すため、短い注文番号で設計例と異なるコードになる。

## 判定理由
設計は採番ルールを『20 + 1 + スマレジ店舗ID3桁0埋め + 注文番号(8桁0埋め後、末尾から6桁取得)』とし、例では注文番号12345→部分『012345』→コード2010010123451（design line 952, 956-957）。専用の SmaregiOtcProductCodeGenerator::normalizeOrderNumber は str_pad(orderNumber,8,'0',LEFT) 後に末尾6桁を取り正しく0埋めする（SyncService経由 line 81 で使用可能, Generator line 76-78）。しかし親バッチ SmaregiOtcOrderPostAction::handle は getProductBarcode() を呼び（line 58）、その内部は `substr($orderNumber, -6)` で0埋めなしに末尾6桁を切り出す（line 97）。生成値は Order->setSmaregiCode で保存され（line 60）、同期サービス SmaregiOtcOrderSyncService::sync は既存 smaregi_code があればそれを再利用し正しい Generator を使わない（line 79-82）。よって6桁未満の注文番号（例12345）では設計例の『012345』ではなく『12345』となり13桁コードにならず、設計と実装が一致しない。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0405_基本設計仕様書(バッチ_受注管理).html:950-957` — 設計要求

```html
            <div class="doc-bullet" style="--lv:0"><span class="doc-marker">・</span><span>スマレジ用商品コード（バーコード）の採番を行う</span></div>
            <div class="doc-bullet" style="--lv:1"><span class="doc-marker">・</span><span>採番ルールは以下の通り（インストアコードの採番ルールに従う）</span></div>
            <p class="doc-p" style="--lv:3">20(固定) + 1(固定) + スマレジ店舗ID(3桁0埋め、スマレジ店舗IDの指定がない場合は000となる) + 注文番号(8桁0埋め後、末尾から6桁取得）</p>
            <h4 class="doc-h doc-h-sub" style="--lv:3">+ チェックディジット</h4>
            <p class="doc-p" style="--lv:4">※チェックディジット = 「奇数桁をそのまま足したもの」と「偶数桁を3倍して足したもの」を合計し、</p>
            <p class="doc-p" style="--lv:5">その結果の一の位を求め、10から引いた数（ただし、結果が10の場合は0）</p>
            <p class="doc-p" style="--lv:2">例: 本店で店頭受取注文を行い、注文番号が12345だった場合</p>
            <p class="doc-p" style="--lv:4">2010010123451　これがスマレジ商品コードとなる</p>
```

## ec-cube-enterprise 実装
getProductBarcodeで採番しsmaregi_codeへ保存
`ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:57-60` — 実装(親バッチ採番呼び出し)

```php
            // スマレジ商品用バーコードの採番
            $smaregiCode = $this->getProductBarcode('20', '1', sprintf('%03d', $smaregiShopId), $orderNumber);
            // スマレジ用商品コード(バーコード)登録
            $Order->setSmaregiCode($smaregiCode);
```

8桁0埋めせず末尾6桁を切り出す
`ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiOtcOrderPostAction.php:94-97` — 実装(0埋め欠落)

```php
    public function getProductBarcode(string $inStoreCode, string $extension, string $shopCode, string $orderNumber): string
    {
        // CheckDigit付与前のJANコード
        $janCode = $inStoreCode.$extension.$shopCode.substr($orderNumber, -6);
```

smaregi_codeがあれば正しいGeneratorを使わない
`ec-cube-enterprise/src/Eccube/Service/Smaregi/Otc/SmaregiOtcOrderSyncService.php:78-82` — 実装(同期は既存コードを再利用)

```php
        try {
            $productCode = $Order->getSmaregiCode();
            if ($productCode === null || $productCode === '') {
                $productCode = $this->productCodeGenerator->generate($storeId, $orderNumber);
            }
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗、指摘維持。正しく0埋めする SmaregiOtcProductCodeGenerator::normalizeOrderNumber (Otc/SmaregiOtcProductCodeGenerator.php:76-78 str_pad(...,8,'0',LEFT) 後 substr(-6)) は存在するが、実行フローで使われていない。実際のパス: Command→SmaregiOtcOrderPostAction::handle→getProductBarcode(SmaregiOtcOrderPostAction.php:97 で `substr($orderNumber,-6)` を0埋めなしで実行)→setSmaregiCode(:60)。その後の SmaregiOtcOrderSyncService::sync:79-82 は `$productCode = $Order->getSmaregiCode();` を優先し、空でない限り Generator を呼ばない(:81 の generate はフォールバックのみ)。よって親バッチの未0埋めコードがそのまま送信される。設計 line 952『注文番号(8桁0埋め後、末尾6桁)』・例 line 956-957(12345→012345→2010010123451、13桁)を満たさず、5桁など6桁未満の注文番号で12桁の異なるコードになる（getProductBarcode は Generator と違い桁数検証もない）。別実装・除外注記とも確認できず。

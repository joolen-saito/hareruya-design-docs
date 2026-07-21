# a07-06_0507_sheet-9_id 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a07-06_0507_sheet-9_id.json#a07-06_0507_sheet-9_id-conformance-737b2de80d45`
- 機能: A07-06 A07-06 複数ネット買取IDから個別入力商品の一覧を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計では ids は必須(〇)だが、実装は ids 未指定・空文字を許容して空配列を返し、さらに非数値要素を黙って除外する。

## 判定理由
設計HTMLのリクエストパラメータ表(line 2003)で ids は型=文字列・必須=〇。実装 BuyOrderIndivisualInputProductController.php では ids を request から取得後、null または '' なら 400 ではなく new JsonResponse([]) を返し(line 43-45、コメントに旧システム互換目的と明記)、カンマ分解後 preg_match('/^\d+$/') に一致する要素だけを array_filter で採用し(line 48-51)、有効IDが空でも空配列を返す(line 55-56)。すなわち ids を必須パラメータとして扱わず、非数値要素はエラーではなく黙って除外している。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html:2003-2003` — 設計要求(ids 必須)

```html
                <tr><td>ids</td><td>文字列</td><td>〇</td><td></td><td>9132,9135,9136,9137</td><td>ネット買取IDをカンマ区切りで指定する</td></tr>
```

## ec-cube-enterprise 実装
必須扱いせず空配列を返す
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php:43-56` — 実装(空許容・数値フィルタ)

```php
        if ($ids === null || $ids === '') {
            return new JsonResponse([]);
        }

        // カンマ区切りを配列に変換し、数字のみをフィルタリング
        $buyOrderIds = array_filter(
            explode(',', $ids),
            static fn (string $id) => preg_match('/^\d+$/', trim($id)) === 1
        );
        $buyOrderIds = array_map('intval', $buyOrderIds);

        // 有効なIDがない場合は空配列を返す
        if (empty($buyOrderIds)) {
            return new JsonResponse([]);
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証失敗。指摘は維持。(1)引用の正しさ: 設計HTMLのリクエストパラメータ表ヘッダは 項目名/型/必須/最大文字数/入力例/備考 で、ids 行は 型=文字列・必須=〇 を確認(line 2000-2003)。指摘者の設計読解(ids必須)は正しく誤読ではない。(2)実装: Controller line 40-56 を実読。ids が null/'' なら 400 ではなく new JsonResponse([]) を返し(line 43-45、旧システム互換のコメント明記)、explode 後 preg_match('/^\d+$/') 一致要素のみ array_filter で採用、有効ID空でも空配列返却(line 55-56)。すなわち ids を必須扱いせず未指定・空文字を許容し、非数値要素を黙って除外する。(3)別実装: この Controller には FormType/Validator/リクエストバリデーションの介在は無く、必須検証を別 Subscriber/Service で行う箇所も見当たらない(直接 $request->request->get で取得)。要求(ids必須・エラー)を満たす代替実装は発見できなかった。

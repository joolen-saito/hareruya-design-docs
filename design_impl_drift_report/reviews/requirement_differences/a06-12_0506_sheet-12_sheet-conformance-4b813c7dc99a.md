# a06-12_0506_sheet-12_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-12_0506_sheet-12_sheet.json#a06-12_0506_sheet-12_sheet-conformance-4b813c7dc99a`
- 機能: A06-12 A06-12 固定価格部門の部門情報を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
固定価格部門取得APIは設計が {"code":200,"section_id":"1"} のJSONオブジェクトを要求するが、実装は option_value のスカラー文字列だけを返している。

## 判定理由
設計書のレスポンスデータ定義（HTML 3210-3211行）は code（文字列/整数、必ず200）と section_id（文字列、固定価格商品部門ID）の2フィールドを持つJSONオブジェクトを要求し、詳細設計のサンプル（3275行、3282行）でも {"code":200,"section_id":"1"} を示す。一方、実装 OptionController::getFixedPriceSection() は mtb_option の FIXED_PRICE_SECTION(option_key='fixed_price_section') の option_value を取得し（57行）、new JsonResponse($value) でその値そのもの（例 "29"）だけを返している（59行）。code フィールドも section_id フィールドも作っていない。テスト OptionControllerTest.php:184-185 も json_encode($expectedValue) というスカラー契約を期待しており、code/section_id 構造を検証していない。反証として同ディレクトリ配下の他Controller/Service/Dtoやレスポンス整形箇所を確認したが、code+section_id 形へラップする実装は存在しない。したがってレスポンスのトップレベル型・フィールド構成が設計と不一致で、実装違いが事実。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:3210-3211` — 設計要求（レスポンスデータ定義）

```html
                <tr><td>code</td><td>文字列</td><td>レスポンスコード、必ず200が入る</td></tr>
                <tr><td>section_id</td><td>文字列</td><td>固定価格商品部門ID</td></tr>
```

## ec-cube-enterprise 実装
option_value のスカラー値をそのままJsonResponseで返しており、code/section_id を持つJSONオブジェクトを構築していない。
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OptionController.php:51-59` — 実装（固定価格部門IDの取得）

```php
    public function getFixedPriceSection(): JsonResponse
    {
        $Option = $this->mtbOptionRepository->findOneBy([
            'option_key' => MtbOption::FIXED_PRICE_SECTION,
        ]);

        $value = $Option?->getOptionValue() ?? '';

        return new JsonResponse($value);
```

code/section_id 構造ではなく json_encode($expectedValue) を期待している。
`ec-cube-enterprise/tests/Eccube/Tests/Web/App/MTGBuyer/V1/Admin/OptionControllerTest.php:184-185` — テスト（スカラー契約を固定）

```php
        $this->assertSame(Response::HTTP_OK, $this->client->getResponse()->getStatusCode());
        $this->assertSame(json_encode($expectedValue), $this->client->getResponse()->getContent());
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず、指摘は維持。(1)別実装なし: ルート名 api_admin_fixed_price_section を持つのは OptionController::getFixedPriceSection() のみで、実体は `$value = $Option?->getOptionValue() ?? '';`（57行）→`return new JsonResponse($value);`（59行）とスカラー文字列をそのまま返す。code/section_id へラップする箇所を rg 'section_id|code.*=>.*200|onKernelResponse|ResponseEvent' で src/ 全体・EventListener・MTGBuyer配下Controller/Subscriber/Serializer を横断したが、応答本文を {"code":200,"section_id":...} 形へ整形する実装は存在しない（Log/Maintenance/CSPHeader Listener はヘッダ系のみで本文非改変）。SummaryByDateAggregator は同 option_value を内部集計に使うだけで本APIの応答は生成しない。(2)引用の正しさ: implEvidence の 57/59行、テスト 184-185行（json_encode($expectedValue) 期待、$expectedValue='29'）は実ファイルと完全一致。designEvidence 3210-3211行に code(文字列/必ず200)・section_id(文字列/固定価格商品部門ID) のレスポンスデータ定義があり、詳細設計 3275行(code:integer 成功時200 / section_id:string)・サンプル 3280-3283行 {"code":200,"section_id":"1"}・図形サンプル 3227行 {"code":200,"section_id":30} と多重に一致。(3)設計側の除外なし: 「本書で扱わないこと」は部門一覧取得・固定価格部門の設定のみで、本APIの応答形は対象。『カスタマイズ区分は現行踏襲／挙動は現行を正とし』は現行pf-apiが code+section_id のJSONオブジェクトを返す挙動を正とする趣旨で、むしろオブジェクト返却を要求する側であり除外にならない。処理フロー 3265行も『コード(200)・部門IDをJSONで返す』と明記。(4)要求の読み違いなし: エンドポイント GET /{api_v1_route}/admin/fixedPriceSection.json は実装ルートと一致し別画面/別APIではない。(5)重複なし。実装はトップレベル型がスカラー文字列で code/section_id フィールドを一切構築しておらず、設計の外部契約と不一致である事実を自ら確認した。

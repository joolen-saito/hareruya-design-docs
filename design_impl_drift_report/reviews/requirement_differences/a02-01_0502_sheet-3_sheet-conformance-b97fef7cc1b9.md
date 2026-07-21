# a02-01_0502_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a02-01_0502_sheet-3_sheet.json#a02-01_0502_sheet-3_sheet-conformance-b97fef7cc1b9`
- 機能: A02-01 A02-01 ポップアップ用商品情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
404失敗レスポンスの本文キーが設計の message ではなく errors 配列になっている。

## 判定理由
設計(行988)は失敗時の本文の形を {code, message}（"Not Found"）と定義し、処理フロー(行976)・エラー処理(行1024)も『メッセージ「Not Found」のJSON』とする。実装では BaseApiException catch(ProductController.php:177-181)が {'code' => $e->getStatusCode(), 'errors' => $e->getErrors()} を返し、NotFoundException(NotFoundException.php)は errors: [$message] を保持するため、本文は {code, errors:["Not Found"]} となる。文言 Not Found は一致するが、設計が指定するフィールド名 message ではなく errors(配列)に格納される。他に {code, message} を返す経路が無いか ProductController の App コントローラ catch と NotFoundException/BaseApiException を確認したが、全て errors キーで返す実装のみで、message キーで返す経路は見当たらない。よって実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0502_基本設計仕様書(API_商品管理).html:988-988` — 設計要求(失敗レスポンス本文)

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>該当する商品規格が無い</td><td><code>{code, message}</code>（"Not Found"）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
設計の message ではなく errors 配列で返す
`ec-cube-enterprise/src/Eccube/Controller/App/ProductController.php:177-181` — 実装(404本文キー errors)

```php
        } catch (BaseApiException $e) {
            return $this->json([
                'code' => $e->getStatusCode(),
                'errors' => $e->getErrors(),
            ], $e->getStatusCode());
```

message 文字列を errors 配列に格納
`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:27-33` — 実装(NotFoundException が errors 配列を保持)

```php
    public function __construct(string $message = 'リソースが見つかりません', ?\Throwable $previous = null, string $logLevel = 'info')
    {
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_NOT_FOUND,
            logLevel: $logLevel,
            previous: $previous
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。引用は正確。設計(0502...html:988 詳細設計・レスポンス失敗)は本文の形を {code, message}（"Not Found"）と明記。ec-cube-enterprise の getPopupProductByProductId(ProductController.php:177-181)は catch(BaseApiException) で ['code'=>$e->getStatusCode(),'errors'=>$e->getErrors()] を返し、NotFoundException.php:30 が errors:[$message] を保持するため本文は {code, errors:["Not Found"]} となる。反証を試みたが全て裏付けに終わった: (1)別経路探索→ /api/popup/product 系のルートはこの1メソッドのみ(route popup_product_by_product_id, ProductController.php:150)。App配下の例外は全て BaseApiException→errors キー経由で、{code,message} を返す経路は無い。 (2)設計側除外→『本書で扱わないこと』(958-960)や業務ルール(979)に失敗本文形式の除外なし。基本設計(891-894)は 200/404 のステータスコードのみ記載で本文形式は詳細設計の {code,message} が唯一の記述。 (3)現行踏襲の検証→詳細設計は『現行踏襲』(951)で挙動確認をpf-apiに置く。そのpf-api(現行系)は同種ポップアップ商品取得で ['code'=>404,'message'=>'Not Found'](pf-api ProductController.php:44-45,312-313,412-413)を返しており、設計の {code,message} は現行の実挙動を正しく記述。ec-cube が errors キーへ変更したのは現行踏襲契約からの実装違い。反証根拠が逆に指摘を補強した。指摘は維持。

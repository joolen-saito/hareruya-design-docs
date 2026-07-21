# a16-02_0516_sheet-4_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a16-02_0516_sheet-4_sheet.json#a16-02_0516_sheet-4_sheet-conformance-d53a80b13440`
- 機能: A16-02 A16-02 言語コードに紐づいたトップバナーの情報一覧を取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計の404失敗レスポンス本文は {code, message} で message は"Language code is not found"だが、実装は {code, errors:['Not Found']} を返し、キー(message→errors配列)・文言(Language code is not found→Not Found)が共に異なる。

## 判定理由
設計(1197行 失敗レスポンス表)は404本文の形を『{code, message}（"Language code is not found"）』と定義。実装 ContentController::getTopBannersByLanguageCode は言語未存在・トップバナー空のとき NotFoundException('Not Found') を投げ(99,107行)、catch で ['code'=>$e->getStatusCode(), 'errors'=>$e->getErrors()] を返す(115,116行)。NotFoundException は errors:[$message] に格納し(NotFoundException.php:30)、getErrors() が配列を返す(BaseApiException.php:48-50)ため、本文は {code:404, errors:['Not Found']}。設計指定のキー message ではなく errors 配列で、文言も 'Language code is not found' ではなく 'Not Found'。ソース全体を rg で検索したが 'Language code is not found' はどこにも存在せず、topBanners応答経路に message キーもない。よって設計の本文キー・文言に対する実装違いを確認。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0516_基本設計仕様書(API_データ管理).html:1197-1197` — 設計要求(404本文形)

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>一覧が空かつ当該言語コードが言語マスタに存在しない</td><td><code>{code, message}</code>（"Language code is not found"）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
errorsキー(配列)で返し、messageキーを持たない
`ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:99-116` — 実装(404本文構築)

```php
                throw new NotFoundException('Not Found');
            }

            $TopBanners = $Language->getTopBanners();
            if ($TopBanners->isEmpty()) {
                log_warning('指定した言語のトップバナーが見つかりません', [
                    'request_url' => $request->getUri(),
                ]);
                throw new NotFoundException('Not Found');
            }

            $response = $this->topBannersResponseBuilder->build($TopBanners);

            return $this->json($response, Response::HTTP_OK);
        } catch (BaseApiException $e) {
            return $this->json([
                'code' => $e->getStatusCode(),
                'errors' => $e->getErrors(),
```

`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:27-30` — NotFoundException(errors配列格納)

```php
    public function __construct(string $message = 'リソースが見つかりません', ?\Throwable $previous = null, string $logLevel = 'info')
    {
        parent::__construct(
            errors: [$message],
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証を試みたが指摘は維持。(1)設計が正典とするpf-api実機と照合すると、pf-api/src/Controller/BannerController.php:53-56 が View::create(['code'=>404,'message'=>'Language code is not found'],404) を返しており、設計1197行の『{code, message}（"Language code is not found"）』は実機を逐語的に反映。設計の誤読ではない。(2)ec-cube-enterprise 側 ContentController::getTopBannersByLanguageCode の catch(113-117行)は ['code'=>$e->getStatusCode(),'errors'=>$e->getErrors()] を返し、NotFoundException.php:30 が errors:[$message] に格納、投入メッセージは 'Not Found'(99,107行)。よって本文は {code:404, errors:['Not Found']} でキー(message→errors配列)・文言(Language code is not found→Not Found)が共に相違。(3)例外再整形の別経路を確認したが、Controller が BaseApiException を自ら catch して JsonResponse を直接返すため KernelException リスナは発火せず、{code,errors} 形式が確定。(4)ec-cube-enterprise 全ソースを rg したが 'Language code is not found' は存在せず、topBanners 応答経路に message キーも無い。設計指定の本文キー・文言に対する実装違いは実在。

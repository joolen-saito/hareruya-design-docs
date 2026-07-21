# a16-01_0516_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a16-01_0516_sheet-3_sheet.json#a16-01_0516_sheet-3_sheet-conformance-fce9edcc660b`
- 機能: A16-01 A16-01 トップバナー情報取得
- 観点: ⑦要求網羅・実装違い

## 要旨
設計は404失敗本文を{code, message}('Not Found')とするが、実装はmessageキーを持たず{code, errors}(errorsは配列)を返す。

## 判定理由
詳細設計のレスポンス（失敗）表(959行)は 404 時の本文の形を『{code, message}（"Not Found"）』と定義する。実装では該当なし時に NotFoundException('Not Found') を throw し、NotFoundException コンストラクタは message を errors: [$message] として親 BaseApiException に渡す(NotFoundException.php 30行)。ContentController の catch(BaseApiException)(70-74行) は本文を ['code' => $e->getStatusCode(), 'errors' => $e->getErrors()] で JSON 化しており、message キーではなく errors 配列を返す。両エンドポイントのcatch経路(70-74行/113-117行)ともに同形で、message キーを返す経路は存在しない。よって本文キー形状が設計(message)と実装(errors配列)で異なる実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0516_基本設計仕様書(API_データ管理).html:959-959` — 設計要求(404失敗本文の形)

```html
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>404</td><td>該当IDのトップバナーが存在しない</td><td><code>{code, message}</code>（"Not Found"）</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Controller/App/ContentController.php:70-74` — 実装(catchでcode+errorsを返す)

```php
        } catch (BaseApiException $e) {
            return $this->json([
                'code' => $e->getStatusCode(),
                'errors' => $e->getErrors(),
            ], $e->getStatusCode());
```

`ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:29-31` — 実装(messageをerrors配列に格納)

```php
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_NOT_FOUND,
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。反証できず。実装は404本文に message キーを一切持たない。NotFoundException(30行)は message を errors:[$message] として BaseApiException に渡し、ContentController の catch(70-74行/113-117行)は ['code'=>..,'errors'=>..] を返す。加えて ExceptionListener(136-139行)が『APIの場合...必ず(code, errors)を返す』とシステム全体ポリシーとして {code, errors} を返しており、代替経路も含め {code, message} を返す経路は存在しない。designEvidence(959行『{code, message}(Not Found)』)・implEvidence 引用ともに実ファイルで一致確認済み。別ルート(rg で topBanner 系ルートは /topBanner/{topBannerId} 等の当該2本のみ、grep -n で確認)や message キー返却の別実装も App 配下に存在しない。現行踏襲原則(pf-api の {code, message})に対し ec-cube-enterprise が {code, errors} を返す実装違いは維持。

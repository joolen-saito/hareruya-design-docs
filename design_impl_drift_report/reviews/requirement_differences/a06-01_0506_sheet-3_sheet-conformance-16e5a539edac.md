# a06-01_0506_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-01_0506_sheet-3_sheet.json#a06-01_0506_sheet-3_sheet-conformance-16e5a539edac`
- 機能: A06-01 A06-01 買取アプリ用ログイン
- 観点: ⑦要求網羅・実装違い

## 要旨
認証失敗レスポンスは設計の {code, message}（中継先画面エラー文言）と異なり、実装は {code, errors:[固定文言]} を返す。

## 判定理由
設計の失敗レスポンスは 401 で本文 {code, message}、message は中継先の画面エラー文言から改行表記を除いたもので pf-api 独自文言を設けない（HTML 1004-1005行）。実装では UnauthenticatedException が errors:[$message] を持ち statusCode 401（UnauthenticatedException.php:29-34）、API 例外ハンドラ ExceptionListener が JsonResponse で {'code'=>$statusCode, 'errors'=>$errors} を返す（ExceptionListener.php:136-139）。すなわちフィールド名が message ではなく errors（配列）で、契約が構造的に一致しない。さらに文言は LoginController がセットする固定文字列（例 'ログインIDまたはパスワードが正しくありません' LoginController.php:58, 70）で、中継が存在しないため中継先画面エラー文言の抽出も行われていない。HTTP ステータス 401 のみ一致。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:1004-1005` — 設計要求（失敗レスポンス）

```html
          <h3 id="function-design-a06-01-a06-01_api_store_purchase_admin_login-レスポンス-失敗">レスポンス（失敗）</h3>
          <div class="table-wrap"><table><thead><tr><th>HTTPステータス</th><th>条件</th><th>本文の形</th></tr></thead><tbody><tr><td>401</td><td>中継先が認証情報を返さない（資格情報の誤り等による認証失敗）</td><td><code>{code, message}</code>（<code>message</code>は中継先の画面エラー文言から改行表記を除いたもの）</td></tr><tr><td>500</td><td>中継先への到達不可・処理中の例外</td><td>pf-apiの共通例外処理に委ねる</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Exception/App/UnauthenticatedException.php:29-34` — 例外のerrors配列と401

```php
        parent::__construct(
            errors: [$message],
            statusCode: Response::HTTP_UNAUTHORIZED,
            logLevel: $logLevel,
            previous: $previous
        );
```

code+errors配列で返す
`ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136-139` — APIエラー応答の形

```php
            $response = new JsonResponse([
                'code' => $statusCode,
                'errors' => $errors,
            ], $statusCode);
```

`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:57-58` — 独自固定文言

```php
        if ($viewMember === null) {
            throw new UnauthenticatedException('ログインIDまたはパスワードが正しくありません');
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。引用を実確認。UnauthenticatedException.php:29-34 は parent::__construct(errors:[$message], statusCode:HTTP_UNAUTHORIZED) で errors 配列を持つ。ExceptionListener.php:136-139 は isAppApi 経路で JsonResponse(['code'=>$statusCode,'errors'=>$errors]) を返し、フィールド名は明確に 'errors'（配列）。さらに:98 で 401 は固定文言['認証エラー']へ強制、LoginController.php:58,70 も独自固定文言。設計1004-1005行は本文の形 {code, message} で message は中継先画面エラー文言。message→errors のリネーム箇所やシリアライザによる変換は存在せず（別Listener経路も探したが APIは:72 の isAppApi 分岐一本）。中継先文言抽出も中継自体が無いため未実装。構造的にも文言由来的にも不一致。指摘は維持。

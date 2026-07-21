# a06-01_0506_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-01_0506_sheet-3_sheet.json#a06-01_0506_sheet-3_sheet-conformance-03e74a89e57b`
- 機能: A06-01 A06-01 買取アプリ用ログイン
- 観点: ⑦要求網羅・実装違い

## 要旨
JWTペイロードは設計が発行者(iss)と利用者ID(aud)を要求するのに対し、実装は sub のみを格納している。

## 判定理由
設計はトークンのペイロードが発行者と利用者ID（管理者会員のID）を持ち署名方式は HS256 と明記（HTML 987-988行）、レスポンスサンプルの jwtToken もデコードすると {"iss":"Sekappy Inc.","aud":825} を含む（HTML 948行）。実装 JwtTokenService::createToken はペイロードを ['sub' => (string) $memberId] のみで生成し（JwtTokenService.php:79-81）、addSignature で alg=HS256 を付与する（JwtTokenService.php:86）。署名方式 HS256 は一致するが、設計が要求する iss(発行者)クレームが無く、利用者ID は aud ではなく sub という別クレーム名・文字列型で格納されている。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:987-988` — 設計要求（トークン発行）

```html
          <h2 id="function-design-a06-01-a06-01_api_store_purchase_admin_login-認証・認可">認証・認可</h2>
          <div class="table-wrap"><table><thead><tr><th>観点</th><th>内容</th></tr></thead><tbody><tr><td>本APIの認証</td><td>本APIはトークン取得の入口であり、<code>jwt-token</code>ヘッダを要求しない。受け取ったログインID・パスワードを中継先の認証に委ねる。</td></tr><tr><td>認証の中継</td><td>EC-CUBEの買取アプリ用ログイン画面へアクセスしてセッションを確立し、ログインID・パスワードをログイン確認へ送信して認証する。</td></tr><tr><td>トークン発行</td><td>認証成功時、中継先が署名付きJWTトークンを発行して返す。トークンのペイロードは発行者と利用者ID（管理者会員のID）を持つ。署名方式はHS256。</td></tr><tr><td>以降の認可</td><td>呼び出し元は受け取ったトークンを以降のpf-api買取系APIの<code>jwt-token</code>ヘッダに付与する。各APIはトークンの利用者IDから管理者会員を引いて認可する（各APIの設計を正とする）。</td></tr><tr><td>認証失敗時</td><td>中継先が認証情報を返さない場合は認証拒否（HTTP 401）とする。</td></tr></tbody></table></div>
```

## ec-cube-enterprise 実装
subのみ・iss/aud無し・HS256
`ec-cube-enterprise/src/Eccube/Security/AccessToken/JwtTokenService.php:79-87` — JWTペイロード生成

```php
        $payload = json_encode([
            'sub' => (string) $memberId,
        ], JSON_THROW_ON_ERROR);

        $jws = $this->jwsBuilder
            ->create()
            ->withPayload($payload)
            ->addSignature($this->secretKey, ['alg' => 'HS256'])
            ->build();
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。JwtTokenService.php:79-87 を実確認。payload は json_encode(['sub'=>(string)$memberId]) のみで、addSignature(...,['alg'=>'HS256']) を付与。iss/aud を注入する別箇所を探すため grep "'iss'|'aud'" を src/Eccube/Security/ に掛けたがヒット0。設計988行は『ペイロードは発行者と利用者ID（管理者会員のID）を持つ・署名HS256』を要求し、サンプルjwtToken(948行)のペイロード部をbase64デコードすると {"iss":"Sekappy Inc.","aud":825} を実際に確認。実装は iss 欠落・aud を sub（文字列型・別クレーム名）で代替。HS256のみ一致。指摘は維持。

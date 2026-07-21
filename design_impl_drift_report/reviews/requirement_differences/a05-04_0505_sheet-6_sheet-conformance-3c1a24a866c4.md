# a05-04_0505_sheet-6_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a05-04_0505_sheet-6_sheet.json#a05-04_0505_sheet-6_sheet-conformance-3c1a24a866c4`
- 機能: A05-04 A05-04 スマレジ受信処理
- 観点: ⑦要求網羅・実装違い

## 要旨
新設計は認証方式をIP制限とするが、実装は共有シークレットヘッダをhash_equalsで検証する方式で、IP制限は見当たらない。

## 判定理由
新・基本設計はL1544『認証方式 IP制限』と明記。実装 AuthenticationService::verify(L33-46)は設定ヘッダ名(secretHeader)上の共有シークレットを hash_equals(\$this->secret, ...) で検証する方式で、WebhookController L52 で呼び出し失敗時401を返す。Smaregi Controller/Service 配下に IP アドレス制限(REMOTE_ADDR/getClientIp/IpUtils/許可IP)実装は grep で該当なし。認証『あり』の点は満たすが方式がIP制限と異なるため実装違い。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1544-1544` — 設計要求(認証方式IP制限)

```html
            <h3 class="doc-h doc-h-section" style="--lv:0">プロトコル　HTTP　メソッド　POST　認証の有無　有　認証方式　IP制限　リクエスト書式　JSON　レスポンス書式　なし<br>(ステータスコードのみ)</h3>
```

## ec-cube-enterprise 実装
`ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/AuthenticationService.php:33-46` — 実装(共有シークレットヘッダ検証)

```php
    public function verify(Request $request): bool
    {
        $headers = $request->headers->all();
        $headerKey = strtolower($this->secretHeader);

        if (isset($headers[$headerKey])) {
            $receivedSecret = $headers[$headerKey][0];
            if (hash_equals($this->secret, $receivedSecret)) {
                return true;
            }
        }

        return false;
    }
```

`ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:52-64` — 認証呼び出し

```php
        if (!$this->authenticationService->verify($request)) {
            log_warning('Smaregi webhook authentication failed', [
                'method' => $request->getMethod(),
                'uri' => $request->getRequestUri(),
                'headers' => $request->headers->all(),
                'query' => $request->query->all(),
                'content' => $request->getContent(),
            ]);

            return new JsonResponse([
                'status' => 'error',
                'message' => 'Authentication failed',
            ], Response::HTTP_UNAUTHORIZED);
```

## 不在確認コマンド

- `rg -n 'REMOTE_ADDR|getClientIp|IpUtils|allowedIps|許可IP' /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi`

## 反証結果

反証を試みた結果、指摘は覆らなかった。新・基本設計L1544が『認証方式 IP制限』と明記。実装はAuthenticationService::verify L33-46で設定ヘッダ(x-sdsch-secret)上の共有シークレットをhash_equalsで検証する方式(WebhookController L52で呼び失敗時401)。反証としてIP制限が別レイヤに存在しないか横断調査したが、(1)security.yamlのsmaregiファイアウォール(L67-69)は pattern:'^/%eccube_smaregi_webhook_route%/' に対し security:false のみで ips: 制限なし、(2)rg で IpUtils/REMOTE_ADDR/getClientIp/allowed_ips/checkIp は Controller/Smaregi・Service/Smaregi・security.yaml のいずれにも該当0件。コード/設定のどの層にもIP制限は無く、認証方式が設計と実際に異なることを確認したため指摘を維持。

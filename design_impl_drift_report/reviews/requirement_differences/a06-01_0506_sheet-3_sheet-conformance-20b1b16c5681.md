# a06-01_0506_sheet-3_sheet 実装違い

- 判定: **CONFIRMED**（confidence: high）
- キュー: `hareruya-design-docs/design_impl_drift_report/findings/a06-01_0506_sheet-3_sheet.json#a06-01_0506_sheet-3_sheet-conformance-20b1b16c5681`
- 機能: A06-01 A06-01 買取アプリ用ログイン
- 観点: ⑦要求網羅・実装違い

## 要旨
設計のエンドポイント /api/admin/login.json・/admin/login.json・/admin/login のいずれとも異なり、実装は /api/v1/admin/login.json を提供している。

## 判定理由
設計は基本設計で POST /api/admin/login.json（HTML 888行）、詳細設計の利用者視点の入口で POST /admin/login.json と POST /admin/login（HTML 984行）を掲げる。実装 LoginController の Route は '/%eccube_api_v1_route%/admin/login.json'（LoginController.php:45）で、eccube_api_v1_route の既定値は 'api/v1'（eccube.yaml:6 の ECCUBE_API_V1_ROUTE、eccube.yaml:72 で参照）のため実URLは /api/v1/admin/login.json。ファイアウォールの member login user routes も /api/v1/admin/login.json のみを許可（eccube.yaml:314）。設計の3経路のいずれも実ルートとして存在せず、実装はバージョン付き別パスだけを提供している。

## 設計要求
`hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:887-889` — 設計要求（エンドポイントURL）

```html
            <h3 class="doc-h doc-h-section" style="--lv:0">エンドポイントURL</h3>
            <p class="doc-p" style="--lv:0">/api/admin/login.json</p>
            <h3 class="doc-h doc-h-section" style="--lv:0">プロトコル　HTTP　メソッド　POST　認証の有無　有　認証方式　IP制限<br>トークン　リクエスト書式　クエリ　レスポンス書式　JSON</h3>
```

## ec-cube-enterprise 実装
バージョン付きパス
`ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:45-45` — 実装ルート

```php
    #[Route('/%eccube_api_v1_route%/admin/login.json', name: 'api_admin_login', methods: ['POST'])]
```

api/v1
`ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:6-6` — route既定値

```yaml
    env(ECCUBE_API_V1_ROUTE): 'api/v1'
```

`ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:314-314` — ファイアウォール許可ルート

```yaml
        - '/api/v1/admin/login.json'
```

## 反証結果

反証を試みた結果、指摘は覆らなかった。別ルート探索を実施したが該当なし。grep -rn 'login.json' と 'api_admin_login' を src/ app/config/ 全体に掛けたところ、ヒットは LoginController.php:45 の #[Route('/%eccube_api_v1_route%/admin/login.json', name: 'api_admin_login', methods:['POST'])] とファイアウォール eccube.yaml:314 の '/api/v1/admin/login.json' のみ。eccube.yaml で ECCUBE_API_V1_ROUTE 既定値='api/v1'（該当行を実確認）のため実URLは /api/v1/admin/login.json 一択。設計HTML887-889行の基本設計『/api/admin/login.json』、984行の詳細設計『POST /admin/login.json / POST /admin/login』のいずれの実ルートも、リダイレクト/エイリアス/別Controllerを含めて存在しない。引用も正確。指摘は維持。（なお設計は現行pf-api挙動の記述だが、観測可能なURL契約が実装と異なる事実は動かない）

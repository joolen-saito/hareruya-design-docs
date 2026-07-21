/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：注文印刷_印刷情報をプリンタへ送信
課題カテゴリ：実装漏れ
課題：A05-01 が GET /order/prints/{店舗ID} ではなく A05-02 と同じPOSTルートで処理される
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. A05-01 の印刷情報取得APIとして、設計書どおり GET http://localhost:8080/order/prints/{店舗ID} を呼び出す
2. ec-cube-enterprise の実装ルートを確認し、GET /order/prints/{店舗ID} が登録されているか確認する
3. 現在登録されている POST http://localhost:8080/api/order/prints/direct/{base_info_id} に ConnectionType=GetRequest または ConnectionType=SetResponse を指定し、A05-01 と A05-02 が同じルート内で分岐していることを確認する

# 期待される挙動【必須】
- A05-01 のエンドポイントURLは /order/prints/{店舗ID} とする
- A05-01 のHTTPメソッドは GET とする
- URLに店舗ID(shop_id)をパス引数として持たせる
- A05-02 の印刷済みステータス更新APIとはエンドポイントを分ける

# 現在の挙動【必須】
- ec-cube-enterprise では、注文印刷APIのルートが `POST /api/order/prints/direct/{base_info_id}` として定義されている。メソッド内で `ConnectionType` を読み、`GetRequest` の場合はA05-01、`SetResponse` の場合はA05-02を同じControllerメソッド内で分岐しているため、設計の `GET /order/prints/{店舗ID}` とエンドポイント分離を満たしていない。

ec-cube-enterprise は POST /api/order/prints/direct/{base_info_id} の単一ルートで GetRequest と SetResponse を分岐する: `ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43-82`
```php
    #[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print', requirements: ['base_info_id' => '\d+'], methods: ['POST'])]
    public function orderDirectPrint(Request $request, int $base_info_id): StreamedResponse
    {
        $connectionType = $request->get('ConnectionType');

        if ($connectionType === 'GetRequest') {
            // 印刷データ送信処理
            $uri = $request->getUriForPath('/');

            $xmlData = $this->orderDirectPrintAction->handle(new OrderDirectPrintInput(
                uri: $uri,
                base_info_id: $base_info_id,
            ));

            // TODO :後ほど対応
            /* 印刷不具合検証のためXMLデータをファイル出力する
            if (!empty($xmlData)) {
                $dir = '/var/www/html/ec-cube/var/log/print_logs/';
                if (!is_dir($dir)) {
                    mkdir($dir, 0777, true);
                }
                $filename = $dir . 'print_' . date('Ymd_His') . '_' . uniqid() . '.xml';;
                file_put_contents($filename, $xmlData);
            }
            */

            $response = new StreamedResponse();
            $response->setCallback(function () use ($xmlData) {
                echo $xmlData;
            });
            $response->headers->set('Content-Type', 'application/octet-stream');

            return $response;
        } elseif ($connectionType === 'SetResponse') {
            // 印刷が完了した受注のステータスを更新
            $this->updatePrintedOrderStatusAction->handle(new UpdatePrintedOrderStatusInput(
                responseFile: $request->get('ResponseFile', ''),
                base_info_id: $base_info_id,
            ));
```
- ベース実装(pf-api)では、`GET /order/print/direct` と `POST /order/print/direct` がどちらも `Admin\OrderController::postPrintDirectAction` に割り当てられている。これは設計HTMLのカスタマイズ説明で「現状」として示された共通メソッド・ConnectionType分岐の由来であり、カスタマイズ後に求められている `/order/prints/{店舗ID}` とは異なる。

ベース実装 pf-api は GET/POST /order/print/direct を同じ controller action に割り当てる: `pf-api/config/routes.yaml:73-80`
```yaml
get_order_print_direct:
    path: /order/print/direct
    controller: App\Controller\Admin\OrderController::postPrintDirectAction
    methods: GET
post_order_print_direct:
    path: /order/print/direct
    controller: App\Controller\Admin\OrderController::postPrintDirectAction
    methods: POST
```

# 根拠
- 設計：
  - A05-01 のエンドポイントURLとHTTPメソッド: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:855-857`
  - 現状の ConnectionType 分岐を A05-02 と分離するカスタマイズ要求: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:858-863`
  - URLに店舗ID(shop_id)を持つ要求とリクエストサンプル: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:877-899`
- ec-cube-enterprise：
  - GET /order/prints/{店舗ID} ではなく POST /api/order/prints/direct/{base_info_id} で登録されている: `ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:43-82`
- ベース実装：
  - 旧ルートでは GET/POST /order/print/direct が同じ action に割り当てられている: `pf-api/config/routes.yaml:73-80`

# 確認メモ
- 確認コマンド: `rg -n "order/prints|order/print/direct|base_info_id|shop_id|店舗ID|methods|Route\(|order_direct_print|GetRequest|SetResponse" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html pf-api/config/routes.yaml pf-api/src/Controller/Admin/OrderController.php ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php`
- 確認コマンド: `rg -n "order/prints|order/print/direct|order_direct_print|prints/direct|base_info_id|shop_id|店舗ID" ec-cube-enterprise/src/Eccube pf-api/src pf-api/config`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html | sed -n '846,906p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html | sed -n '1030,1048p'`
- 確認コマンド: `nl -ba pf-api/config/routes.yaml | sed -n '70,82p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php | sed -n '38,84p'`
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json#a05-01_0505_sheet-3_sheet-conformance-4054eb26d82f'`
- 設計HTMLの 856-863 行と 877-899 行は、カスタマイズ後のA05-01を GET /order/prints/{店舗ID} とし、A05-02とはエンドポイントを分ける要求を示している。
- 同じHTMLの後半には pf-api 由来の /order/print/direct + ConnectionType 記述があるが、gpt-5.5 high の批判的レビューでは、これはベース実装の確認値であり前半のカスタマイズ要求を上書きしないと判定された。
- pf-api は旧方式として GET/POST /order/print/direct を同じ action に割り当てている。
- ec-cube-enterprise は POST /api/order/prints/direct/{base_info_id} の単一ルート内で GetRequest と SetResponse を分岐しており、GET /order/prints/{店舗ID} は見つからない。

/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：注文印刷_印刷情報をプリンタへ送信
課題カテゴリ：実装漏れ
課題：存在しない店舗IDで注文印刷APIを呼び出しても404にならず空の200応答になり得る
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. BaseInfo に存在しない数値IDを確認する
2. ec-cube-enterprise の注文印刷API POST http://localhost:8080/api/order/prints/direct/{存在しないbase_info_id} に ConnectionType=GetRequest を指定して呼び出す
3. HTTPステータスとレスポンス本文を確認する

# 期待される挙動【必須】
- 設計上の店舗ID(shop_id)に存在しない数値IDが指定された場合は HTTP 404 を返す
- 存在しない店舗IDでは印刷対象検索や空文字の正常応答へ進まない

# 現在の挙動【必須】
- ec-cube-enterprise では、ルート引数 `base_info_id` を `OrderDirectPrintAction` に渡すが、`BaseInfoRepository::find($base_info_id)` が null を返した場合でも404を返さない。`if ($BaseInfo && $BaseInfo->isMainShop())` に入らないため支店向けの `getDirectPrintOrderList($base_info_id)` を実行し、対象データがなければ空文字を返す。

ec-cube-enterprise は存在しない base_info_id でも 404 にせず支店向け検索へ進む: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:37-52`
```php
    public function handle(OrderDirectPrintInput $input): string
    {
        $uri = $input->uri;
        $base_info_id = $input->base_info_id;

        $BaseInfo = $this->baseInfoRepository->find($base_info_id);

        if ($BaseInfo && $BaseInfo->isMainShop()) {
            $OrderDataList = $this->orderRepository->getPrintOrderListMainShop($base_info_id);
        } else {
            $OrderDataList = $this->orderRepository->getDirectPrintOrderList($base_info_id);
        }

        if (empty($OrderDataList)) {
            return '';
        }
```

ec-cube-enterprise のControllerは GetRequest の戻り値を StreamedResponse として返し 404 を設定しない: `ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:48-75`
```php
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
```
- ベース実装(pf-api)は旧方式として `GET /order/print/direct` と `POST /order/print/direct` を同じController actionへ割り当てており、設計がカスタマイズ後に求める店舗IDパス引数の404契約はこのルート定義上には存在しない。設計の「支店での処理を踏襲」という404要件を enterprise 側で満たす処理も追加されていない。

ベース実装 pf-api は /order/print/direct の旧ルートで店舗IDパス引数を持たない: `pf-api/config/routes.yaml:73-80`
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
  - A05-01 はURLに店舗ID(shop_id)を持つ: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:877-899`
  - 存在しない店舗ID(shop_id)は404を返す: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:900-903`
- ec-cube-enterprise：
  - BaseInfo が null でも404にせず支店向け検索へ進む: `ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php:37-52`
  - GetRequest のレスポンスに404ステータス設定がない: `ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php:48-75`
- ベース実装：
  - 旧方式のルートには店舗IDパス引数がなく、GET/POST /order/print/direct を同じ action に割り当てる: `pf-api/config/routes.yaml:73-80`

# 確認メモ
- 確認コマンド: `rg -n "店舗ID\(shop_id\)|存在しない店舗ID|404|/order/prints|shop_id|base_info_id" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html hareruya-design-docs/design_impl_drift_report/findings/a05-01_0505_sheet-3_sheet.json`
- 確認コマンド: `rg -n "BaseInfo|base_info_id|shop_id|NotFound|404|createNotFound|find\(|getDirectPrintOrderList|OrderDirectPrintAction" ec-cube-enterprise/src/Eccube/Service/Admin/Order ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php pf-api/src/Controller/Admin/OrderController.php pf-api/config/routes.yaml`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/App/OrderController.php | sed -n '43,88p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Admin/Order/OrderDirectPrintAction.php | sed -n '37,52p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/OrderRepository.php | sed -n '1550,1618p'`
- 確認コマンド: `nl -ba pf-api/config/routes.yaml | sed -n '73,80p'`
- gpt-5.5 high の批判的レビューでは、候補全体は missing/non-integer 店舗IDを含むためそのまま出力不可だが、数値で存在しないIDが空200になり得る点は独立差分として切り出せると判定された。
- 本レジストリ項目は存在しない数値IDだけにスコープを限定し、missing/non-integer 店舗IDは a05-01-order-print-route-method-store-id-mismatch 側のルート未実装に含める。
- enterprise 実装では design の shop_id に相当する実装引数を base_info_id とみなし、BaseInfo が存在しない場合の分岐を確認した。

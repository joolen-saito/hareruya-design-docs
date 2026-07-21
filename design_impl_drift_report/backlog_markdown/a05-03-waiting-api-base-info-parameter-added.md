/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API受注管理
機能：店頭注文番号取得
課題カテゴリ：実装違い
課題：店頭注文番号取得APIが無パラメータのGET /{_locale}/waiting_api/get_waitingではなくbase_info_id必須で店舗絞り込みする
設計書：0505_基本設計仕様書(API_受注管理).xlsx

# 再現手順【必須】
1. 設計書どおり GET http://localhost:8080/ja/waiting_api/get_waiting を呼び出す
2. ec-cube-enterprise の店頭注文番号表示画面で生成される取得APIのURLを確認する
3. Controller と Repository で base_info_id が取得対象の絞り込みに使われているか確認する

# 期待される挙動【必須】
- 店頭注文番号リストの取得APIは GET /{_locale}/waiting_api/get_waiting として提供する
- 本APIはリクエストパラメータを持たない
- パスパラメータ {_locale} は言語識別子であり、取得対象の絞り込みには用いない
- pf-eccube3 の HareruyaEc プラグインと同様に、店頭注文番号札（数字）と注文番号札（アルファベット）を1配列にまとめて返す

# 現在の挙動【必須】
- ec-cube-enterprise では、店頭注文番号取得APIが `GET /waiting_api/get_waiting_number/{base_info_id}` として定義され、Controller メソッドも `int $base_info_id` を必須引数として受け取る。`base_info_id > 0` の場合だけ取得処理に入り、手動登録注文番号札とピック済み注文番号札の双方を BaseInfo で絞り込む。

ec-cube-enterprise Controller は base_info_id 必須ルートを定義し BaseInfo で取得する: `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:56-72`
```php
    #[Route(path: '/waiting_api/get_waiting_number/{base_info_id}', name: 'get_waiting_number', requirements: ['base_info_id' => '\d+'], methods: ['GET'])]
    public function getWaitingNumber(Request $request, int $base_info_id): JsonResponse
    {
        $returnResponse = [];

        if ($base_info_id > 0) {
            // 手動登録注文番号札の取得(店舗ごとに取得)
            $WaitingTagLists = $this->waitingTagRepository->findBy(
                ['BaseInfo' => $base_info_id],
                ['id' => 'ASC']
            );

            // ピック済み注文番号札の取得
            $WaitingNumberLists = $this->waitingNumberRepository->getWaitingNumberByStatus(
                OrderStatus::PICKED,
                (int) $base_info_id
            );
```

ec-cube-enterprise Twig は BaseInfo.id を指定して get_waiting_number を呼ぶ: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:92-98`
```twig
    // 注文番号リストの更新
    function update() {
        $.ajax({
            type: 'GET',
            url: '{{ url('get_waiting_number', {'base_info_id': BaseInfo.id}) }}',
            {# TODO: ECCUBE_HARERUYA-182 店頭注文呼び出し番号表示 店舗切り替えができるようになったら修正 #}
            data: {},
```

ec-cube-enterprise Repository は waiting number を BaseInfo で絞り込む: `ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php:43-53`
```php
    public function getWaitingNumberByStatus(int $status, int $baseInfoId): mixed
    {
        return $this->createQueryBuilder('wn')
            ->select('wn')
            ->join(Order::class, 'o', 'WITH', 'wn.orderId = o.id AND o.OrderStatus = :statusId')
            ->setParameter('statusId', $status)
            ->andWhere('IDENTITY(wn.BaseInfo) = :baseInfoId')
            ->setParameter('baseInfoId', $baseInfoId)
            ->orderBy('wn.waitingNumber', 'ASC')
            ->getQuery()
            ->getResult();
```
- ベース実装(pf-eccube3)では、`/waiting_api/get_waiting` を `waiting_api_get` として登録し、Twig も `url('waiting_api_get')` をデータなしで呼び出す。Controller と Repository は `base_info_id` を受け取らず、BaseInfo で絞り込まない。

ベース実装 pf-eccube3 は /waiting_api/get_waiting を無パラメータAPIとして登録する: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:283-285`
```php
        // 注文番号取得API
        $c->get('/waiting_api/get_waiting', '\Plugin\HareruyaEc\Controller\WaitingNumberController::getWaiting')
            ->bind('waiting_api_get');
```

ベース実装 pf-eccube3 Controller は getWaiting(Application $app) で base_info_id を受け取らない: `pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php:22-67`
```php
    public function getWaiting(Application $app)
    {
        $response = [];

        // ピック完了済みの注文番号札（数字）の取得
        $waitingNumberList = $app['hareruya_ec.repository.waiting_number']->getWaitingNumberByStatus(OrderStatus::ORDER_PICKED);

        // 注文番号札(アルファベット)の取得
        $waitingTagList = $app['hareruya_ec.repository.waiting_tag']->findAll([], ['id' => 'ASC']);

        // 画面表示最大件数を超える場合は間の出荷完了の注文番号も含める
        if (count($waitingNumberList) + count($waitingTagList) > $app['config']['HareruyaEc']['const']['waiting_monitor_max_size']) {
            $delivNumbers = [];
            $delivWaitingList = $app['hareruya_ec.repository.waiting_number']->getWaitingNumberByStatus(OrderStatus::ORDER_DELIV);
            foreach ($delivWaitingList as $delivWaiting) {
                $delivNumbers[] = $delivWaiting->getWaitingNumber();
            }

            foreach ($waitingNumberList as $waitingNumber) {
                $targetNumber = $waitingNumber->getWaitingNumber();

                // responseが空でなく、最後尾の次の番号がtargetNumberと一致しない場合
                // 間の番号がすべて出荷済みか確認し、出荷済みならリストに追加する
                if ((count($response) !== 0) && ((end($response) + 1) !==  $targetNumber)) {
                    $betweenNumbers = range(end($response) + 1, $targetNumber - 1);
                    if ($this->isBetweenAllOrderDeliv($delivNumbers, $betweenNumbers)) {
                        $response = array_merge($response, $betweenNumbers);
                    }
                }
                $response[] = $targetNumber;
            }
        } else {
            // ピック完了済みの注文番号札（数字）を1つずつresponseに追加
            foreach ($waitingNumberList as $waitingNumber) {
                $response[] = $waitingNumber->getWaitingNumber();
            }
        }

        // 注文番号札(アルファベット)を1つずつresponseに追加
        foreach ($waitingTagList as $waitingTag) {
            $response[] = $waitingTag->getWaitingTag();
        }

        return $app->json($response, Response::HTTP_OK, [
            'Content-Type' => 'application/json',
        ]);
```

ベース実装 pf-eccube3 Twig は waiting_api_get をデータなしで呼び出す: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/waiting_get_js.twig:88-91`
```twig
        $.ajax({
            type: 'GET',
            url: '{{ url('waiting_api_get') }}',
            data: {},
```

# 根拠
- 設計：
  - A05-03 は pf-eccube3 の HareruyaEc プラグインを正とする: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1440-1442`
  - 利用者視点の入口は GET /{_locale}/waiting_api/get_waiting: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1460-1462`
  - リクエストパラメータなし、{_locale} は絞り込みに使わない: `hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1474-1476`
- ec-cube-enterprise：
  - base_info_id 必須の get_waiting_number ルート: `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:56-72`
  - 画面JSも BaseInfo.id を渡す: `ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig:92-98`
  - Repository も BaseInfo で絞り込む: `ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php:43-53`
- ベース実装：
  - pf-eccube3 は /waiting_api/get_waiting を waiting_api_get として登録: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:283-285`
  - pf-eccube3 の getWaiting は base_info_id を受け取らない: `pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php:22-67`
  - pf-eccube3 の Repository は BaseInfo フィルタを持たない: `pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php:23-30`

# 確認メモ
- 確認コマンド: `rg -n "waiting_api|get_waiting|get_waiting_number|base_info_id|BaseInfo|店頭注文番号|待ち番号|waiting" hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html hareruya-design-docs/design_impl_drift_report/findings/a05-03_0505_sheet-5_sheet.json ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html | sed -n '1438,1478p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html | sed -n '1384,1412p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php | sed -n '274,286p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php | sed -n '1,78p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Block/js/waiting_get_js.twig | sed -n '84,94p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Repository/DtbWaitingNumberRepository.php | sed -n '18,42p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php | sed -n '1,120p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Block/js/waiting_get_js.twig | sed -n '88,104p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/DtbWaitingNumberRepository.php | sed -n '1,90p'`
- 設計HTMLの前半には /waiting_api/get_waiting/{店舗ID} と店舗IDに紐づく受注データの記述があるが、gpt-5.5 high の批判的レビューでは、後半の詳細設計が pf-eccube3 を正とし、GET /{_locale}/waiting_api/get_waiting・リクエストパラメータなしを明示しているため、この範囲で VERIFIED と判定された。
- 本項目は、無パラメータAPI契約に対して enterprise が base_info_id を必須化し BaseInfo 絞り込みしている差分に限定する。

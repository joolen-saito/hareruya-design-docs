/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント買取
機能：買取履歴詳細
課題カテゴリ：実装違い
課題：買取履歴詳細と承諾確定のURLが設計のdetail/updateではなくnet/otc/confirmに分割されている
設計書：0305_基本設計仕様書(フロント_ネット買取).xlsx

# 再現手順【必須】
1. 買取履歴を持つ会員で `http://localhost:8080/ja/mypage/purchase_history` を表示する
2. 買取履歴一覧のオーダーIDまたは処理状態画像から詳細画面へ遷移し、URL が `/ja/mypage/purchase_history/detail/{id}` か `/ja/mypage/purchase_history/net/{buyOrderId}` または `/ja/mypage/purchase_history/otc/{otcBuyOrderId}` か確認する
3. ネット買取の連絡済み詳細画面で「承諾確定」フォームの送信先が `/ja/mypage/purchase_history/update/{id}` か `/ja/mypage/purchase_history/net/{buyOrderId}/confirm` か確認する

# 期待される挙動【必須】
- 買取履歴一覧のオーダーID・処理状態画像から `GET /{_locale}/mypage/purchase_history/detail/{id}` へ遷移し、当該買取注文の詳細を表示する
- 詳細画面の「承諾確定」ボタンは `POST /{_locale}/mypage/purchase_history/update/{id}` へ送信する
- 設計は pf-eccube3 の `detail/{id}` / `update/{id}` の統一路線を参照元としている

# 現在の挙動【必須】
- ec-cube-enterprise の `PurchaseHistoryController` は、ネット買取詳細を `GET /mypage/purchase_history/net/{buyOrderId}`、店頭買取詳細を `GET /mypage/purchase_history/otc/{otcBuyOrderId}` として分けている。一覧テンプレートも `row.channel == 'net'` で `mypage_purchase_history_detail_net` と `mypage_purchase_history_detail_otc` を出し分けており、設計の `/{_locale}/mypage/purchase_history/detail/{id}` には遷移しない。ネット買取の承諾確定も `POST /mypage/purchase_history/net/{buyOrderId}/confirm` で、設計の `/{_locale}/mypage/purchase_history/update/{id}` とは異なる。

ec-cube-enterprise ネット買取詳細と承諾確定の route: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:99-155`
```php
    #[Route(
        path: '/mypage/purchase_history/net/{buyOrderId}',
        name: 'mypage_purchase_history_detail_net',
        requirements: ['buyOrderId' => '\\d+'],
        methods: ['GET'],
    )]
    #[Template(template: 'Mypage/purchase_history_detail.twig')]
    public function detailNet(int $buyOrderId): array
    {
        $customer = $this->getSessionCustomer();
        $buyOrder = $this->dtbBuyOrderRepository->find($buyOrderId);
        if (!$buyOrder instanceof DtbBuyOrder || $buyOrder->getCustomer()->getId() !== $customer->getId()) {
            throw new NotFoundHttpException();
        }

        $netDetail = $this->purchaseHistoryNetDetailAction->handle($buyOrder);

        return [
            'Customer' => $customer,
            'channel' => 'net',
            'netDetail' => $netDetail,
            'buyOrderId' => $buyOrderId,
        ];
    }

    /**
     * 査定承諾確定
     */
    #[Route(
        path: '/mypage/purchase_history/net/{buyOrderId}/confirm',
        name: 'mypage_purchase_history_net_confirm',
        requirements: ['buyOrderId' => '\\d+'],
        methods: ['POST'],
    )]
    public function confirmNet(int $buyOrderId, Request $request): RedirectResponse
    {
        $this->isTokenValid();

        $customer = $this->getSessionCustomer();
        $buyOrder = $this->dtbBuyOrderRepository->find($buyOrderId);
        if (!$buyOrder instanceof DtbBuyOrder || $buyOrder->getCustomer()->getId() !== $customer->getId()) {
            throw new NotFoundHttpException();
        }
        if ($buyOrder->getBuyOrderStatus()->getId() !== MtbBuyOrderStatus::COMMUNICATED) {
            throw new ConflictHttpException();
        }

        try {
            $this->purchaseHistoryNetConsentConfirmAction->handle(
                new PurchaseHistoryNetConsentConfirmInput($buyOrder, $request->request->all()),
            );
            $this->addSuccess('front.mypage.purchase_history.detail.confirm.success');
        } catch (BadRequestHttpException) {
            $this->addRequestError('front.mypage.purchase_history.detail.confirm.error');
        }

        return $this->redirectToRoute('mypage_purchase_history_detail_net', ['buyOrderId' => $buyOrderId]);
```

ec-cube-enterprise 店頭買取詳細の route: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:189-196`
```php
    #[Route(
        path: '/mypage/purchase_history/otc/{otcBuyOrderId}',
        name: 'mypage_purchase_history_detail_otc',
        requirements: ['otcBuyOrderId' => '\\d+'],
        methods: ['GET'],
    )]
    #[Template(template: 'Mypage/purchase_history_detail.twig')]
    public function detailOtc(int $otcBuyOrderId): array
```

ec-cube-enterprise 一覧はnet/otc詳細routeを出し分け: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig:88-92`
```twig
                    {% for row in pagination %}
                        {% set detail_url = row.channel == 'net'
                            ? path('mypage_purchase_history_detail_net', { buyOrderId: row.orderInternalId })
                            : path('mypage_purchase_history_detail_otc', { otcBuyOrderId: row.orderInternalId })
                        %}
```

ec-cube-enterprise ネット買取詳細フォームの送信先: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig:9-11`
```twig
{% set d = netDetail %}
<form id="purchase-history-net-consent-form" method="post" action="{{ url('mypage_purchase_history_net_confirm', { buyOrderId: buyOrderId }) }}">
    <input type="hidden" name="_token" value="{{ csrf_token(constant('Eccube\\Common\\Constant::TOKEN_NAME')) }}">
```
- ベース実装 pf-eccube3 は、FrontControllerProvider で `GET/POST /mypage/purchase_history/detail/{id}` と `POST /mypage/purchase_history/update/{id}` を定義し、詳細テンプレートのフォームも `mypage_purchase_history_update` へ送信している。設計 HTML も冒頭で pf-eccube3 の買取履歴詳細処理とテンプレートを正とすると明記しており、enterprise の route 分割はベース実装と一致しない。

ベース実装 pf-eccube3 詳細/update route: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:230-237`
```php
        $c->match('/mypage/purchase_history', '\Plugin\HareruyaEc\Controller\Mypage\PurchaseController::index')
            ->bind('mypage_purchase_history');
        $c->match('/mypage/purchase_history/detail/{id}', '\Plugin\HareruyaEc\Controller\Mypage\PurchaseController::detail')
            ->assert('id', '\d+')
            ->bind('mypage_purchase_history_detail');
        $c->post('/mypage/purchase_history/update/{id}', '\Plugin\HareruyaEc\Controller\Mypage\PurchaseController::update')
            ->assert('id', '\d+')
            ->bind('mypage_purchase_history_update');
```

ベース実装 pf-eccube3 詳細フォームの送信先: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:14-16`
```twig
{% block main %}
    <form method="post" action="{{ path('mypage_purchase_history_update', {id: buyOrder.buyOrderId}) }}">
        {% set manipulatableStatusId = constant('Plugin\\HareruyaEc\\Entity\\MtbBuyOrderStatus::COMMUNICATED') %}
```

# 根拠
- 設計：
  - 設計はpf-eccube3の買取履歴詳細処理とテンプレートを正とし、URLをdetail/{id}の形とする: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3807-3810`
  - 利用者視点の入口はdetail/{id}とupdate/{id}: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3827-3829`
  - 画面遷移でもdetail/{id}とupdate/{id}を指定: `hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書(フロント_ネット買取).html:3876-3877`
- ec-cube-enterprise：
  - ネット買取詳細と承諾確定はnet/confirm route: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php:99-155`
  - 一覧はnet/otc routeを出し分ける: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig:88-92`
- ベース実装：
  - pf-eccube3はdetail/{id}とupdate/{id}を定義: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:230-237`
  - pf-eccube3の詳細フォームはupdate routeへ送信: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig:14-16`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-12_0305_sheet-11_sheet.json#f06-12_0305_sheet-11_sheet-conformance-677684663677'`
- 確認コマンド: `rg -n "purchase_history/detail|purchase_history/update|mypage_purchase_history_detail|mypage_purchase_history_update|GET /\{_locale\}/mypage/purchase_history|POST /\{_locale\}/mypage/purchase_history" hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig`
- 確認コマンド: `rg -n "mypage_purchase_history_detail_net|mypage_purchase_history_detail_otc|mypage_purchase_history_net_confirm|purchase_history/net|purchase_history/otc|purchase_history/detail|purchase_history/update" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '3807,3838p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0305_基本設計仕様書\(フロント_ネット買取\).html | sed -n '3869,3879p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php | sed -n '96,158p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/PurchaseHistoryController.php | sed -n '184,200p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history.twig | sed -n '86,94p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/purchase_history_detail_net.twig | sed -n '8,14p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php | sed -n '226,240p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/purchase_history_detail.twig | sed -n '13,18p'`

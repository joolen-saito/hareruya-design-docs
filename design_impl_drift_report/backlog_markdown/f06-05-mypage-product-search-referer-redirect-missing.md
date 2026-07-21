/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：マイページ
課題カテゴリ：実装漏れ
課題：商品検索からの戻り先がセッションにある場合もマイページを表示してしまう
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 未ログイン状態で商品検索画面からカート追加、または入荷待ち/お気に入り操作を行い、`PRODUCT_SEARCH_REFERER` がセッションに保存される状態を作る
2. ログイン後に `http://localhost:8080/ja/mypage` へ遷移する
3. マイページが表示されるか、直前の商品検索画面へリダイレクトされセッションの戻り先が消去されるか確認する

# 期待される挙動【必須】
- マイページトップ表示時、セッションに商品検索の戻り先がある場合は、戻り先を取得してセッションから消去する
- 商品検索の戻り先がある場合はマイページを表示せず、直前の商品検索画面へリダイレクトする
- 商品検索の戻り先がない場合だけ、保有ポイントと各機能ブロックを含むマイページを表示する

# 現在の挙動【必須】
- ec-cube-enterprise では、未ログイン時の商品操作で `PRODUCT_SEARCH_REFERER` をセッションに保存する処理は存在する。しかし `MypageController::index()` はログイン会員を取得し、期限の近いポイント履歴を取得して `Mypage/index.twig` 用の配列を返すだけで、`PRODUCT_SEARCH_REFERER` を取得・消去してリダイレクトする処理がない。そのため戻り先が残っていてもマイページを表示する。

ec-cube-enterprise カート追加未ログイン時に商品検索戻り先を保存: `ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php:446-452`
```php
        $Customer = $this->getUser();
        if ($Customer === null) {
            $request->getSession()->set('PRODUCT_SEARCH_REFERER', $request->headers->get('referer'));

            return $this->json([
                'message' => trans('front.cart.product.request_notlogin.message'),
                'status' => 'nologin',
```

ec-cube-enterprise 入荷待ち未ログイン時に商品検索戻り先を保存: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/NotifylistController.php:122-130`
```php
        /** @var Customer|null $Customer */
        $Customer = $this->getUser();
        if (!$Customer) {
            $request->getSession()->set('PRODUCT_SEARCH_REFERER', $request->headers->get('referer'));

            return new JsonResponse([
                'status' => 'nologin',
                'message' => trans('error_messages.product.request_notlogin.message'),
            ], 400);
```

ec-cube-enterprise マイページトップは戻り先を消費しない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:125-138`
```php
    #[Route(path: '/mypage/', name: 'mypage', methods: ['GET'])]
    #[Template(template: 'Mypage/index.twig')]
    public function index(Request $request, PaginatorInterface $paginator): array
    {
        /** @var Customer $Customer */
        $Customer = $this->getUser();

        $NextDeadlinePointHistory = $this->pointHistoryRepository->getNextDeadlinePointHistory($Customer->getPlayer());

        return [
            'Customer' => $Customer,
            'nextDeadlinePointHistory' => $NextDeadlinePointHistory,
        ];
    }
```
- ベース実装 pf-eccube3 では、未ログイン時の商品操作で `PRODUCT_SEARCH_REFERER` を保存し、マイページトップの先頭で `$request->getSession()->get('PRODUCT_SEARCH_REFERER')` を確認する。値がある場合は `remove('PRODUCT_SEARCH_REFERER')` で消去してから `$app->redirect($productSearchUrl)` を返すため、マイページ本体の表示に進まない。

ベース実装 pf-eccube3 カート追加未ログイン時に戻り先を保存: `pf-eccube3/app/Plugin/HareruyaEc/Controller/CartController.php:137-141`
```php
        $customer = $app->user();
        if (!($customer instanceof Customer)) {
            $request->getSession()->set('PRODUCT_SEARCH_REFERER', $request->headers->get('referer'));

            return $this->responseJson($app, 'error_messages.product.request_notlogin.message', 'nologin');
```

ベース実装 pf-eccube3 マイページトップで戻り先を消費してリダイレクト: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:161-172`
```php
    public function index(Application $app, Request $request)
    {
        $productSearchUrl = $request->getSession()->get('PRODUCT_SEARCH_REFERER');
        if ($productSearchUrl) {
            $request->getSession()->remove('PRODUCT_SEARCH_REFERER');

            return $app->redirect($productSearchUrl);
        }

        $player = $app['hareruya_ec.repository.player']->findOneByCustomer($app['user']);

        $nextDeadlinePointHistory = $app['hareruya_ec.repository.point_history']->getNextDeadlinePointHistory($app, $player);
```

# 根拠
- 設計：
  - マイページ概要で商品検索戻り先がある場合は検索画面へ戻すと規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2751-2758`
  - マイページトップ入口の期待挙動としてリダイレクトを要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2771`
  - 処理フローで戻り先の取得・消去とマイページ非表示を要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2780`
  - エッジケースとセッション仕様でも同じ挙動を規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2788-2828`
- ec-cube-enterprise：
  - 戻り先を保存するがマイページトップでは消費しない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:125-138`
- ベース実装：
  - pf-eccube3はマイページトップの先頭で戻り先を消去してリダイレクトする: `pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php:161-168`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-05_0306_sheet-7_sheet.json#f06-05_0306_sheet-7_sheet-conformance-c39f07856b6a'`
- 確認コマンド: `rg -n "PRODUCT_SEARCH_REFERER|戻り先|マイページを表示せず|検索画面へリダイレクト|現行踏襲|カスタマイズ要件に記載の内容以外" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "PRODUCT_SEARCH_REFERER|productSearchUrl|headers->get\('referer'\)|request_notlogin" ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/NotifylistController.php pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php pf-eccube3/app/Plugin/HareruyaEc/Controller/CartController.php`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '2751,2828p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php | sed -n '120,145p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/CartController.php | sed -n '438,452p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/NotifylistController.php | sed -n '118,130p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/NotifylistController.php | sed -n '202,211p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/Mypage/MypageController.php | sed -n '145,172p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/CartController.php | sed -n '128,142p'`

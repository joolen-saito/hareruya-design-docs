/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：店頭PC用アカウント制御
課題カテゴリ：実装違い
課題：支店店内アカウントで本店店内アカウント向けのアクセス制限画面を利用できる
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 顧客グループが `支店用店内アカウント` の会員でログインする
2. `http://localhost:8080/ja/mypage/change`、`http://localhost:8080/ja/contact`、`http://localhost:8080/ja/mypage/delivery` など、設計で店内アカウント制限対象に含まれる画面へアクセスする
3. 支店店内アカウントでも共通エラー画面ではなく各画面が表示されないか確認する

# 期待される挙動【必須】
- 支店店内アカウントは、本店店内アカウントでアクセス制限されている画面にもアクセスできない
- 支店店内アカウントは、上記制限に加えて本店からの注文もアクセスできない
- 遮断対象機能へアクセスした場合は共通エラー画面を返す

# 現在の挙動【必須】
- ec-cube-enterprise の支店用店内アカウント seed は `id=5`、`shop_front_flg=0`、`branch_shop_front_flg=1` である。一方、一般的な店内アカウント制限ルート `SHOP_FRONT_RESTRICTED_ROUTES` は `CustomerGroupAccessListener` の `getShopFrontFlg()` 分岐でのみ遮断されるため、支店用店内アカウントには適用されない。

ec-cube-enterprise 支店用店内アカウントは shop_front_flg=0 / branch_shop_front_flg=1: `ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:80-86`
```php
            ['id' => 1, 'name' => '通常会員', 'point_percentage' => 1, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2025-07-15 09:00:01+00', 'member_id' => null],
            ['id' => 2, 'name' => 'SCG取引用', 'point_percentage' => 5, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 05:01:33+00', 'member_id' => null],
            ['id' => 3, 'name' => '店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '1', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-06-26 17:56:17+00', 'member_id' => null],
            ['id' => 4, 'name' => 'Sekappy用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2019-03-21 20:00:37+00', 'update_date' => '2019-03-22 04:55:23+00', 'member_id' => null],
            ['id' => 5, 'name' => '支店用店内アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '1', 'create_date' => '2022-06-09 01:00:51+00', 'update_date' => '2022-06-29 22:39:26+00', 'member_id' => null],
            ['id' => 6, 'name' => '海外代理販売用', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2022-11-28 20:39:03+00', 'update_date' => '2023-05-23 04:36:09+00', 'member_id' => null],
            ['id' => 9, 'name' => '集換社アカウント', 'point_percentage' => 0, 'shop_front_flg' => '0', 'branch_shop_front_flg' => '0', 'create_date' => '2025-10-27 20:39:04+00', 'update_date' => '2025-10-27 21:22:15+00', 'member_id' => null],
```

ec-cube-enterprise 一般制限は getShopFrontFlg() のみで判定し、支店フラグは本店注文系だけ: `ec-cube-enterprise/src/Eccube/EventListener/CustomerGroupAccessListener.php:73-90`
```php
        // 店内アカウントでブラックリストのルートの場合は403
        if ($CustomerGroup->getShopFrontFlg() && $this->isShopFrontRestrictedRoute($route)) {
            $event->setResponse($this->createRestrictedResponse('front.error.restricted_otc.title', 'front.error.restricted_otc.message'));

            return;
        }

        // 支店アカウントでブラックリストのルートの場合は403
        if (
            $CustomerGroup->getBranchShopFrontFlg()
            && $this->baseInfoService->getByRequestShop()->isMainShop()
            && $this->isBranchShopFrontMainShopRestrictedRoute($route)
        ) {
            $event->setResponse($this->createRestrictedResponse(
                'front.error.restricted_otc_branch_shop_front.title',
                'front.error.restricted_otc_branch_shop_front.message',
            ));
        }
```

ec-cube-enterprise 一般制限対象には会員情報変更・お問い合わせ・配送先・買取等が含まれる: `ec-cube-enterprise/src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:24-106`
```php
     * shopFrontFlg = true（店内アカウント）がアクセス不可なルート
     *
     * @var list<string>
     */
    public const SHOP_FRONT_RESTRICTED_ROUTES = [
        // --- イベント申込 ---
        'event_entry',                              // イベント申込入力画面
        'event_entry_confirm',                      // イベント申込確認（POST）
        'event_entry_register',                     // イベント申込登録（POST）
        'events_payment_url',                       // イベント参加費決済URL取得（POST）
        'events_payment_finish',                    // イベント決済完了コールバック
        'event_payment_complete',                   // イベント決済完了画面
        'event_payment_cancel',                     // イベント決済キャンセル画面
        // --- マイページ（イベント） ---
        'mypage_event_history',                     // マイページ：マイイベント・デッキ登録
        // --- マイページ（会員情報） ---
        'mypage_change',                            // マイページ：会員情報変更
        'mypage_change_complete',                   // マイページ：会員情報変更完了
        'mypage_withdraw',                          // マイページ：退会手続き
        'mypage_withdraw_confirm',                  // マイページ：退会確認
        'mypage_withdraw_complete',                 // マイページ：退会完了
        // --- お問い合わせ ---
        'contact',                                  // お問い合わせ入力
        'contact_confirm',                          // お問い合わせ確認
        'contact_complete',                         // お問い合わせ完了
        'contact_history',                          // お問い合わせ履歴一覧
        'contact_history_detail',                   // お問い合わせ履歴詳細
        // --- パスワード再設定 ---
        'forgot',                                   // パスワード再発行入力
        'forgot_complete',                          // パスワード再発行メール送信完了
        'forgot_reset',                             // パスワード再設定
        'forgot_resetcomplete',                     // パスワード再設定完了
        // --- 入荷通知 ---
        'mypage_notifylist',                        // マイページ：入荷通知一覧
        'push_receive',                             // 入荷通知登録・解除（POST）
        'push_all_receive',                         // 入荷通知一括登録・解除（POST）
        // --- マイページ（お気に入り） ---
        'mypage_favorite',                          // マイページ：お気に入り一覧
        // --- マイページ（ポイント） ---
        'mypage_point_history',                     // マイページ：ポイント履歴
        'mypage_point_history_page',                // マイページ：ポイント履歴（ページング）
        // --- マイページ（お届け先） ---
        'mypage_delivery',                          // マイページ：お届け先一覧
        'mypage_delivery_new',                      // マイページ：お届け先新規登録
        'mypage_delivery_edit',                     // マイページ：お届け先編集
        'mypage_delivery_new_complete',             // マイページ：お届け先新規登録完了（POST）
        'mypage_delivery_edit_complete',            // マイページ：お届け先編集完了（POST）
        'mypage_delivery_delete',                   // マイページ：お届け先削除（DELETE）
        // --- マイページ（買取履歴） ---
        'mypage_purchase_history',                  // マイページ：買取履歴一覧
        'mypage_purchase_history_detail_net',       // マイページ：買取履歴詳細（ネット）
        'mypage_purchase_history_net_confirm',      // マイページ：買取履歴詳細（査定承諾確定POST）
        'mypage_purchase_history_net_bulk',         // マイページ：買取履歴詳細（まとめて買取）
        'mypage_purchase_history_detail_otc',       // マイページ：買取履歴詳細（店頭）
        // --- マイページ（購入履歴） ---
        'mypage_shopping_history',                  // マイページ：購入履歴一覧
        'mypage_shopping_history_detail',           // マイページ：購入履歴詳細
        'mypage_shopping_history_printOrderReceipt', // マイページ：購入履歴レシート印刷
        // --- 注文フロー（配送先） ---
        'shopping_shipping_change',                 // 注文：配送先変更（POST）
        'shopping_shipping',                          // 注文：お届け先の指定
        'shopping_shipping_edit',                   // 注文：お届け先の追加・変更
        'shopping_shipping_edit_complete',            // 注文：お届け先追加・変更完了（POST）
        'shopping_shipping_multiple',               // 注文：複数配送設定
        'shopping_shipping_multiple_edit',          // 注文：複数配送先の編集
        'shopping_customer',                          // 注文：購入者情報入力（POST）
        // --- 買取 ---
        'purchase_index',                           // 買取トップ
        'purchase_search',                          // 買取商品一覧
        'purchase_product_search_unisearch_query',  // 買取商品一覧（ユニサーチAPI）
        'purchase_product_search_unisearch_temp',   // 買取商品一覧（temp読込 POST）
        'purchase_product_search_unisearch_lazy_load', // 買取商品一覧（lazy読込 POST）
        'purchase_detail',                          // 買取商品詳細
        'purchase_cart',                            // 買取：カート画面
        'purchase_cart_update',                     // 買取：カート更新（POST）
        'purchase_fill',                            // 買取：申込情報入力
        'purchase_confirm',                         // 買取：申込確認（POST）
        'purchase_add',                             // 買取：カート追加（POST）
        // --- デッキ登録（イベント） ---
        'mypage_deckentry_edit',                     // デッキ登録：編集画面
        'mypage_deckentry_update',                  // デッキ登録：更新（POST）
        'mypage_deckentry_check',                   // デッキ登録：確認画面
    ];
```

ec-cube-enterprise 支店フラグ側の制限はshopping系のみ: `ec-cube-enterprise/src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php:108-125`
```php
    /**
     * branchShopFrontFlg = true（支店用店内アカウント）が本店でアクセス不可なルート
     *
     * @var list<string>
     */
    public const BRANCH_SHOP_FRONT_MAIN_SHOP_RESTRICTED_ROUTES = [
        'shopping',                                 // 注文：注文手続き（本店）
        'shopping_redirect_to',                     // 注文：外部決済等へのリダイレクト（POST）
        'shopping_confirm',                         // 注文：確認（POST）
        'shopping_checkout',                        // 注文：決済実行（POST）
        'shopping_shipping',                        // 注文：お届け先の指定
        'shopping_shipping_edit',                   // 注文：お届け先の追加・変更
        'shopping_shipping_edit_complete',          // 注文：お届け先追加・変更完了（POST）
        'shopping_shipping_change',                 // 注文：配送先変更（POST）
        'shopping_shipping_multiple',               // 注文：複数配送設定
        'shopping_shipping_multiple_edit',          // 注文：複数配送先の編集
        'shopping_complete',                        // 注文：完了画面
    ];
```
- ベース実装 pf-eccube3 でも、店内アカウントの多数画面制限は `onRestrictedControllerBefore`、支店店内アカウントの本店購入制限は `onRestrictedControllerBeforeForBranchShopFront` として別フックで登録されている。設計はこの支店制限を『上記の店内アカウントで制限されている画面に加え、本店からの注文』へ拡張しているが、ec-cube-enterprise では支店フラグが本店注文系だけに留まっている。

ベース実装 pf-eccube3 は多数画面制限フックと支店本店注文制限フックを分けて登録: `pf-eccube3/app/Plugin/HareruyaEc/event.yml:26-106`
```yaml
# 店頭注文アカウントアクセス制限
eccube.event.controller.events_entry.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_deckentry_list.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_events.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_change_team_list.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_change.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_withdraw.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.contact.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.contact_history.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.forgot.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_notifylist.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_point_history.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_delivery.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_delivery_edit.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_delivery_new_edit.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_delivery_delete.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_purchase_history.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_purchase_history_detail.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_purchase_history_update.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_shopping_history.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_shopping_history_detail.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.mypage_shopping_history_repurchase.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.shopping_shipping_change.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.shopping_shipping.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.shopping_shipping_edit_change.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.shopping_customer.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.purchase_cart.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.purchase_fill.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.purchase_confirm.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.purchase_add.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.purchase_remove.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.deckentry_edit.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.deckentry_update.before:
    - [onRestrictedControllerBefore, NORMAL]
eccube.event.controller.deckentry_check.before:
    - [onRestrictedControllerBefore, NORMAL]

# 支店店頭注文アカウントアクセス制限
eccube.event.controller.shopping.before:
    - [onRestrictedControllerBeforeForBranchShopFront, NORMAL]
eccube.event.controller.shopping_confirm.before:
    - [onRestrictedControllerBeforeForBranchShopFront, NORMAL]
eccube.event.controller.shopping_delivery.before:
    - [onRestrictedControllerBeforeForBranchShopFront, NORMAL]
eccube.event.controller.shopping_payment.before:
    - [onRestrictedControllerBeforeForBranchShopFront, NORMAL]
eccube.event.controller.shopping_shipping.before:
    - [onRestrictedControllerBeforeForBranchShopFront, NORMAL]
eccube.event.controller.shopping_complete.before:
    - [onRestrictedControllerBeforeForBranchShopFront, NORMAL]
```

ベース実装 pf-eccube3 CustomerGroupEvent は shop_front_flg と branch_shop_front_flg を別分岐で遮断: `pf-eccube3/app/Plugin/HareruyaEc/Event/CustomerGroupEvent.php:30-72`
```php
    public function onRestrictedControllerBefore($event)
    {
        $user = $this->app->user();
        if (!($user instanceof \Eccube\Entity\Customer)) {
            return;
        }

        $player = $this->app['hareruya_ec.repository.player']
            ->findOneByCustomer($user);

        // if ($player->getCustomerGroup()->getId() === DtbCustomerGroup::OTC) {
        if ($player->getCustomerGroup()->getShopFrontFlg()) {
            $response = $this->app->render('error.twig', [
                'error_title' => $this->app->trans('front.error.restricted_otc.title'),
                'error_message' => $this->app->trans('front.error.restricted_otc.message')
            ]);
            $event->setResponse($response);

            return;
        }
    }

    /**
     * 支店アカウントにページを表示させない
     */
    public function onRestrictedControllerBeforeForBranchShopFront($event)
    {
        $user = $this->app->user();
        if (!($user instanceof \Eccube\Entity\Customer)) {
            return;
        }

        $player = $this->app['hareruya_ec.repository.player']
            ->findOneByCustomer($user);

        if ($player->getCustomerGroup()->getBranchShopFrontFlg()) {
            $response = $this->app->render('error.twig', [
                'error_title' => $this->app->trans('front.error.restricted_otc_branch_shop_front.title'),
                'error_message' => $this->app->trans('front.error.restricted_otc_branch_shop_front.message')
            ]);
            $event->setResponse($response);

            return;
```

# 根拠
- 設計：
  - 店内アカウントと支店店内アカウントの識別: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7278-7280`
  - 支店店内アカウントは本店店内アカウントの制限画面に加えて本店注文を制限: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7296-7322`
- ec-cube-enterprise：
  - 支店用店内アカウントは shop_front_flg=0 のため一般制限分岐に入らない: `ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php:80-86`
  - 一般制限と支店本店注文制限が別分岐: `ec-cube-enterprise/src/Eccube/EventListener/CustomerGroupAccessListener.php:73-90`
- ベース実装：
  - pf-eccube3 も通常店内制限と支店本店注文制限を別フックとして持つ: `pf-eccube3/app/Plugin/HareruyaEc/event.yml:26-106`
  - pf-eccube3 の判定メソッド: `pf-eccube3/app/Plugin/HareruyaEc/Event/CustomerGroupEvent.php:30-72`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-26_0306_sheet-22_pc.json#f06-26_0306_sheet-22_pc-conformance-ca36f8d02ee5'`
- 確認コマンド: `rg -n "ca36f8d02ee5|支店店内|支店用店内|店内アカウント|アクセス制限|本店からの注文|ネット買取|配送先|大会申込|branch_shop_front_flg|shop_front_flg" design_impl_drift_report/findings/f06-26_0306_sheet-22_pc.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "CustomerGroupAccessListener|SHOP_FRONT_RESTRICTED_ROUTES|BRANCH_SHOP_FRONT_MAIN_SHOP_RESTRICTED_ROUTES|branch_shop_front_flg|shop_front_flg|getShopFrontFlg|getBranchShopFrontFlg|支店用店内" ec-cube-enterprise/src/Eccube/EventListener/CustomerGroupAccessListener.php ec-cube-enterprise/src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php ec-cube-enterprise/src/Eccube/Entity/DtbCustomerGroup.php`
- 確認コマンド: `rg -n "onRestrictedControllerBefore|onRestrictedControllerBeforeForBranchShopFront|branch_shop_front_flg|shop_front_flg|getShopFrontFlg|getBranchShopFrontFlg|支店店頭注文アカウントアクセス制限|店頭注文アカウントアクセス制限" pf-eccube3/app/Plugin/HareruyaEc/event.yml pf-eccube3/app/Plugin/HareruyaEc/HareruyaEcEvent.php pf-eccube3/app/Plugin/HareruyaEc/Event/CustomerGroupEvent.php pf-eccube3/app/Plugin/HareruyaEc/Entity/DtbCustomerGroup.php`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/EventListener/CustomerGroupAccessListener.php | sed -n '73,90p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Service/Front/CustomerGroupAccessRouteRegistry.php | sed -n '24,125p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/app/DoctrineMigrations/Version20260618000009.php | sed -n '80,86p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/event.yml | sed -n '26,106p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Event/CustomerGroupEvent.php | sed -n '30,72p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7278,7280p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7296,7322p'`

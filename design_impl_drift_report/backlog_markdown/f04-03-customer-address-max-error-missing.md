/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント注文
機能：配送先の新規登録_変更
課題カテゴリ：実装漏れ
課題：配送先登録上限到達時に上限超過エラーを表示せず404になる
設計書：0304_基本設計仕様書(フロント_注文).xlsx

# 再現手順【必須】
1. 会員のアドレス帳を登録上限の20件まで登録した状態でログインする
2. 商品をカートに入れて http://localhost:8080/ja/shopping に進み、お届け先の追加導線から配送先の新規登録画面へ進む
3. ご注文方法指定画面のエラー領域に上限超過エラーが表示されて戻るか、404になるか確認する

# 期待される挙動【必須】
- 新規登録時、アドレス帳件数が登録上限（20）以上なら登録できない
- 上限超過時は「お届け先登録数の上限を超えています。」を `front.shopping.error.customer_address_max` として表示する
- エラー表示位置はご注文方法指定画面のエラー領域とし、ご注文方法指定画面へ戻す
- 既存配送先の編集時は上限判定をスキップする

# 現在の挙動【必須】
- ec-cube-enterprise の `shippingEdit()` は、ログイン会員の配送先件数が `eccube_deliv_addr_max` 以上の場合に `throw new NotFoundHttpException();` を実行する。ご注文方法指定画面へ戻して `front.shopping.error.customer_address_max` を表示する処理はない。登録完了側の `shippingEditComplete()` も同じ上限判定で404を返す。

ec-cube-enterprise 配送先新規登録画面表示時は上限到達で404: `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:812-823`
```php

        // ログイン済みかどうかチェック
        $CustomerAddress = new CustomerAddress();
        if ($this->isGranted('IS_AUTHENTICATED_FULLY')) {
            /** @var Customer $Customer */
            $Customer = $this->getUser();
            // 配送先登録上限に達していたら処理を止めて 404 を返す
            $addressCurrNum = count($Customer->getCustomerAddresses());
            $addressMax = $this->eccubeConfig['eccube_deliv_addr_max'];
            if ($addressCurrNum >= $addressMax) {
                throw new NotFoundHttpException();
            }
```

ec-cube-enterprise 配送先登録完了時も上限到達で404: `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:948-956`
```php

        if ($this->isGranted('IS_AUTHENTICATED_FULLY')) {
            /** @var Customer $Customer */
            $Customer = $this->getUser();
            $addressCurrNum = count($Customer->getCustomerAddresses());
            $addressMax = $this->eccubeConfig['eccube_deliv_addr_max'];
            if ($addressCurrNum >= $addressMax) {
                throw new NotFoundHttpException();
            }
```

ec-cube-enterprise ロケールは別キーのみで設計キーがない: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:104-110`
```yaml
common.user_name: "%last_name% %first_name% 様"
common.user_name.honor: "様"
common.login: ログイン
common.remember_me: 次回から自動的にログインする
common.signup: 新規会員登録
common.forgot_login: ログイン情報をお忘れですか？
common.customer_address_count_is_over: "お届け先登録の上限の%count%件に達しています。お届け先を入力したい場合は、削除か変更を行ってください。"
```
- ベース実装 pf-eccube3 は `DeliveryService::canAddCustomerAddress()` で新規登録（IDなし）のみ上限判定を行い、上限到達時に `front.shopping.error.customer_address_max` を `addError()` して `false` を返す。呼び出し元の `deliveryEdit()` / `deliveryConfirm()` は `false` の場合に `shopping` へリダイレクトするため、ご注文方法指定画面のエラー領域で上限超過を表示できる。

ベース実装 pf-eccube3 新規登録のみ上限判定してエラー追加: `pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php:78-94`
```php
    public function canAddCustomerAddress($id)
    {
        $app = $this->app;

        // idが存在する場合は追加処理ではなく編集処理のため本ロジックをスキップする
        if (is_null($id)) {
            $addressCurrNum = count($app['user']->getCustomerAddresses());
            $addressMax = $app['config']['deliv_addr_max'];
            if ($addressCurrNum >= $addressMax) {
                $app->addError('front.shopping.error.customer_address_max');

                return false;
            }
        }

        return true;
    }
```

ベース実装 pf-eccube3 上限時はご注文方法指定へ戻す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:947-952`
```php
    public function deliveryEdit(Application $app, Request $request, $id = null)
    {
        // 配送先住所最大値判定
        if (!$app['hareruya_ec.service.delivery']->canAddCustomerAddress($id)) {
            return $app->redirect($app->path('shopping'));
        }
```

ベース実装 pf-eccube3 確認から登録時も上限時は戻す: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php:980-985`
```php
    public function deliveryConfirm(Application $app, Request $request, $id = null)
    {
        // 配送先住所最大値判定
        if (!$app['hareruya_ec.service.delivery']->canAddCustomerAddress($id)) {
            return $app->redirect($app->path('shopping'));
        }
```

ベース実装 pf-eccube3 設計キーの日本語文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:1458-1462`
```yaml
        error:
            timeout: 購入処理がタイムアウトしました。お手数ですが、再度購入手続きを始めてください。
            address_edited: お届け先の情報に変更がありました。お確かめの上、再度購入手続きをお試しください。
            no_order: 受注情報が見つかりません。
            customer_address_max: お届け先登録数の上限を超えています。
```

# 根拠
- 設計：
  - 登録上限超過時はご注文方法指定へ戻す: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2063-2064`
  - 登録上限判定とエラー表示の詳細: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2071-2084`
  - 登録上限20の確認値: `hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:2087`
- ec-cube-enterprise：
  - 登録上限20の設定値: `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:102-106`
  - 上限到達時に404を返す実装: `ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php:812-823`
- ベース実装：
  - pf-eccube3では上限到達時に設計キーをaddErrorしてshoppingへ戻す: `pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php:78-94`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f04-03_0304_sheet-5_sheet.json#f04-03_0304_sheet-5_sheet-conformance-a91cc0e4d5d1'`
- 確認コマンド: `python3 - <<'PY' ... search excel_to_html/output/0304_基本設計仕様書(フロント_注文).html for customer_address_max and お届け先登録数の上限 ... PY`
- 確認コマンド: `rg -n "function canAddCustomerAddress|canAddCustomerAddress|customer_address_max|front\.shopping\.error\.customer_address_max" pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "customer_address_max|お届け先登録数の上限|The maximum number of addresses|deliv_addr_max|customer_address_count_is_over" ec-cube-enterprise/src/Eccube/Resource/locale ec-cube-enterprise/app/config pf-eccube3/app/Plugin/HareruyaEc/Resource/locale`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php | sed -n '812,890p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/ShoppingController.php | sed -n '948,975p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Service/DeliveryService.php | sed -n '78,94p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/ShoppingController.php | sed -n '947,985p'`

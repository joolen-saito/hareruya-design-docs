/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：店頭注文呼び出し番号表示
課題カテゴリ：実装違い
課題：本店の店頭注文呼び出し番号URLが設計の `/ja/waiting_number_1` ではなく `/ja/waiting_number` になっている
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 本店URL `http://localhost:8080/ja/waiting_number_1` にアクセスする
2. 店頭注文呼び出し番号表示画面が表示されるか確認する
3. 実装上のURL `http://localhost:8080/ja/waiting_number` でのみ画面が表示されないか確認する

# 期待される挙動【必須】
- 本店の店頭注文呼び出し番号表示画面は `https://www.hareruyamtg.com/ja/waiting_number_1` で表示する
- 現行の2つ目モニターURL `https://www.hareruyamtg.com/ja/waiting_number_2` は不要のため除去する
- 支店URLは `https://www.hareruyamtg.com/ja/{支店名(英)}/waiting_number` 形式とする

# 現在の挙動【必須】
- ec-cube-enterprise のフロントルートは `front_controllers` により本店では `/{_locale}` prefix が付き、`WaitingNumberController::waitingNumber()` は `#[Route(path: '/waiting_number', name: 'waiting_number')]` の1本だけを定義している。そのため本店の実URLは `/ja/waiting_number` になり、設計の `/ja/waiting_number_1` ルートは定義されていない。

ec-cube-enterprise waiting_number は /waiting_number 1本: `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:37-47`
```php
    /**
     * 注文番号表示画面
     *
     * @return array<mixed, mixed>
     */
    #[Route(path: '/waiting_number', name: 'waiting_number', methods: ['GET'])]
    #[Template(template: 'Waiting/waiting_number.twig')]
    public function waitingNumber(): array
    {
        return [];
    }
```

ec-cube-enterprise front_controllers は本店 /{_locale}・支店 /{_locale}/{_shop}: `ec-cube-enterprise/app/config/eccube/routes.yaml:35-48`
```yaml
front_controllers:
    resource: '../../../src/Eccube/Controller/Front'
    type: attribute
    # NOTE:
    # 本店では'/{_locale}'、支店では'/{_locale}/{_shop}'となる。
    # {_shop}を任意にするだけでは'/ja//products'のようにスラッシュが重複してしまう為、
    # {_shop}の前のスラッシュをrequirementsに含めることで'/ja/products'となるようにしている。
    prefix: /{_locale}{_shop}
    requirements:
        _locale: '%app_locales%'
        _shop: '%app_shop_route_requirement%'
    defaults:
        _locale: '%locale%'
        _shop: ''
```
- ベース実装 pf-eccube3 は同じ `WaitingNumberController::waitingNumber()` を `/waiting_number_1` と `/waiting_number_2` の2ルートにbindしていた。設計はこのベース挙動を踏まえ、本店は `/waiting_number_1` を残し、2つ目モニターの `/waiting_number_2` を除去する指定になっている。

ベース実装 pf-eccube3 は waiting_number_1 / waiting_number_2 を定義: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:277-281`
```php
        // 注文番号表示（店内モニター:2画面）
        $c->match('/waiting_number_1', '\Plugin\HareruyaEc\Controller\WaitingNumberController::waitingNumber')
            ->bind('waiting_number_1');
        $c->match('/waiting_number_2', '\Plugin\HareruyaEc\Controller\WaitingNumberController::waitingNumber')
            ->bind('waiting_number_2');
```

ベース実装 pf-eccube3 は第1・第2共通Controllerを描画: `pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php:11-17`
```php
    /**
     * 注文番号表示画面(第1・2共通)
     */
    public function waitingNumber(Application $app)
    {
        return $app->render('Waiting/waiting_number.twig');
    }
```

# 根拠
- 設計：
  - 本店URLは waiting_number_1、waiting_number_2 は不要、支店URLは /{支店名}/waiting_number: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7037-7043`
  - 詳細設計でも /{_locale}/waiting_number_1 / waiting_number_2 を入口として定義: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:7117-7119`
- ec-cube-enterprise：
  - 実装ルートは /waiting_number: `ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php:37-47`
  - front_controllers prefix により本店は /ja/waiting_number となる: `ec-cube-enterprise/app/config/eccube/routes.yaml:35-48`
- ベース実装：
  - pf-eccube3 は waiting_number_1 / waiting_number_2 を定義: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:277-281`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json#f06-25_0306_sheet-21_sheet-conformance-f888fb1b7661'`
- 確認コマンド: `rg -n "f888fb1b7661|waiting_number_1|waiting_number_2|本店のURL|支店のURL|/waiting_number|waiting_number" design_impl_drift_report/findings/f06-25_0306_sheet-21_sheet.json excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "waiting_number_1|waiting_number_2|waiting_number|front_controllers|prefix: /\{_locale\}\{_shop\}|Route\(path: '/waiting_number'" ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php ec-cube-enterprise/app/config/eccube/routes.yaml ec-cube-enterprise/src/Eccube/Resource/template/default/Waiting/waiting_number.twig`
- 確認コマンド: `rg -n "waiting_number_1|waiting_number_2|waiting_number|match\('/waiting_number|bind\('waiting_number" pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php ec-cube/app/Customize/Controller/WaitingNumberController.php ec-cube/app/template/default/Waiting/waiting_number.twig`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/WaitingNumberController.php | sed -n '37,47p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/app/config/eccube/routes.yaml | sed -n '35,48p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php | sed -n '277,281p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/WaitingNumberController.php | sed -n '11,17p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7037,7043p'`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '7117,7119p'`

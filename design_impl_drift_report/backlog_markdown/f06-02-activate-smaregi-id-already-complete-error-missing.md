/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：本会員登録
課題カテゴリ：実装漏れ
課題：スマレジID保有済みの仮会員を本会員登録すると完了済みエラーではなく正常完了扱いになる
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. 仮会員の `dtb_player.smaregi_id` に値が入っている状態を用意する
2. 対象会員の本会員化URL `http://localhost:8080/ja/entry/activate/<secret_key>` にアクセスする
3. 表示される画面と、完了メール送信・自動ログイン・本登録完了画面への遷移有無を確認する

# 期待される挙動【必須】
- 秘密キーから取得した会員の選手情報にスマレジIDが既にある場合は、一度本登録済みと判断する
- スマレジID保有済みの場合は再登録せず、共通エラー画面に「完了済みです。」「既に会員登録が完了されております。」を表示して終了する
- スマレジID保有済みの場合は、本会員登録完了メール送信・自動ログイン・本登録完了画面表示へ進まない

# 現在の挙動【必須】
- ec-cube-enterprise の `entryActivate()` は、秘密キーで未本会員を取得できない場合だけ `already_activated` エラーを返す。スマレジID保有済みの判定は `linkSmaregiCustomer()` 内にあり、`Player->getSmaregiId()` が非空の場合は「既に連携済みなら何もしない (冪等).」として `$Customer` を返すだけで、`already_activated` エラーにはしない。そのため呼び出し元は完了メール送信、自動ログイン、完了画面または商品検索画面への遷移へ進む。

ec-cube-enterprise 本会員化のエラー分岐と後続処理: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:250-256`
```php
            } catch (EntryAlreadyActivatedException $e) {
                return $this->render('Entry/activate_error.twig', ['error_type' => 'already_activated']);
            } catch (EntryInvalidSecretKeyException $e) {
                return $this->render('Entry/activate_error.twig', ['error_type' => 'forbidden']);
            } catch (EntryActivateFailedException $e) {
                return $this->render('Entry/activate_error.twig', ['error_type' => 'activate_failed']);
            }
```

ec-cube-enterprise スマレジID既存時の冪等スキップ: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:343-352`
```php
        $Player = $Customer->getPlayer();
        if ($Player === null) {
            return $Customer;
        }

        // 既に連携済みなら何もしない (冪等).
        $smaregiId = $Player->getSmaregiId();
        if ($smaregiId !== null && $smaregiId !== '') {
            return $Customer;
        }
```

ec-cube-enterprise スマレジ連携後に完了メール・自動ログインへ進む処理: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:301-322`
```php
        // スマレジ会員を作成し、採番された会員IDをdtb_playerへ保存
        $ActivatedCustomer = $this->linkSmaregiCustomer($secret_key);

        // メール送信
        $this->mailService->sendCustomerCompleteMail($Customer);

        // Assign session carts into customer carts
        $Carts = $this->cartService->getCarts();
        $qtyInCart = 0;
        foreach ($Carts as $Cart) {
            $qtyInCart += $Cart->getTotalQuantity();
        }

        if ($ActivatedCustomer instanceof Customer) {
            $this->security->login($ActivatedCustomer, 'form_login', 'customer');
        }

        if ($qtyInCart) {
            $this->cartService->save();
        }

        return $qtyInCart;
```

ec-cube-enterprise 完了済みエラー文言の表示テンプレート: `ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/activate_error.twig:21-24`
```twig
            <div class="p-hareruya-error__body">
                <h2 class="c-hareruya-heading--lev1">{{ ('front.entry.activate_error.' ~ error_type ~ '.title')|trans }}</h2>
                <p class="c-hareruya-text u-hareruya-mt10">{{ ('front.entry.activate_error.' ~ error_type ~ '.message')|trans }}</p>
            </div>
```

ec-cube-enterprise 完了済みエラー文言: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:451-456`
```yaml
front.entry.activate_error.forbidden.title: アクセスできません
front.entry.activate_error.forbidden.message: このURLは無効です。
front.entry.activate_error.already_activated.title: 完了済みです。
front.entry.activate_error.already_activated.message: 既に会員登録が完了されております。
front.entry.activate_error.activate_failed.title: 会員情報の有効化に失敗しました
front.entry.activate_error.activate_failed.message: 時間を置いて再度お試しいただくか、お問い合わせください。
```
- ベース実装 pf-eccube3 では、本会員化処理中に `findOneByCustomer()` で選手情報を取得し、`getSmaregiId()` が空でない場合は「スマレジIDがある=一度本登録を行った会員」として `error.twig` を返す。返却する `error_title` / `error_message` は `error_messages.already_activated` で、文言は「完了済みです。」「既に会員登録が完了されております。」である。この分岐ではスマレジ再登録、完了メール、自動ログインへ進まない。

ベース実装 pf-eccube3 スマレジID既存時の完了済みエラー: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:217-233`
```php
        try {
            $Customer = $app['eccube.repository.customer']->getNonActiveCustomerBySecretKey($secret_key);
        } catch (\Exception $e) {
            return $app->render('error.twig', [
                'error_title' => $app->trans('error_messages.already_activated.title'),
                'error_message' => $app->trans('error_messages.already_activated.message'),
            ]);
        }

        $player = $app['hareruya_ec.repository.player']->findOneByCustomer($Customer);
        // スマレジIDがある=一度本登録を行った会員と判断して再登録は行わない。
        if (!empty($player->getSmaregiId())) {
            return $app->render('error.twig', [
                'error_title' => $app->trans('error_messages.already_activated.title'),
                'error_message' => $app->trans('error_messages.already_activated.message'),
            ]);
        }
```

ベース実装 pf-eccube3 完了済みエラー文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:257-259`
```yaml
    already_activated:
        title: 完了済みです。
        message: 既に会員登録が完了されております。
```

ベース実装 pf-eccube3 共通エラー表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/error.twig:127-130`
```twig
                    {% if is404 or (error_title and error_message) %}
                        <div id="midashi1">
                            <h1>{{ error_title }}</h1>
                            <p>{{ error_message }}</p>
```

# 根拠
- 設計：
  - スマレジID保有済みの場合は完了済みエラーで終了: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1816-1827`
  - 二重本登録防止とエッジケース: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:1830-1834`
- ec-cube-enterprise：
  - スマレジID保有済みはエラーではなく return $Customer: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:343-352`
  - 呼び出し元は完了メール・自動ログインへ進む: `ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php:301-322`
- ベース実装：
  - pf-eccube3はスマレジID保有済みを完了済みエラーで終了する: `pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php:226-233`
  - 完了済みエラー文言: `pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml:257-259`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-02_0306_sheet-4_sheet.json#f06-02_0306_sheet-4_sheet-conformance-d52de6028d9c'`
- 確認コマンド: `rg -n "スマレジID|完了済みです|既に会員登録が完了|linkSmaregiCustomer|Smaregi|smaregiId|smaregi_id|activate_error|customer_status|本会員登録" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '1816,1835p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php | sed -n '250,323p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/EntryController.php | sed -n '340,356p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Entry/activate_error.twig | sed -n '1,38p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '445,456p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/EntryController.php | sed -n '210,270p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/locale/message.ja.yml | sed -n '253,261p'`
- 確認コマンド: `rg -n "error_title|error_message" pf-eccube3/app/template pf-eccube3/app/Plugin/HareruyaEc/Resource/template -g 'error.twig' -g '*.twig'`

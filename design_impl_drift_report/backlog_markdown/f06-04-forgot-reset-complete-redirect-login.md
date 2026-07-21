/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：パスワード再発行
課題カテゴリ：実装違い
課題：パスワード再設定後、完了画面ではなくログイン画面に遷移する
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. パスワード再発行画面( http://localhost:8080/ja/forgot )から手続きを行い、受信メールから再設定URLに遷移する
2. 新しいパスワードを入力して「変更する」ボタンを押下する
3. 遷移先と表示文言を確認する

# 期待される挙動【必須】
- パスワード更新成功後、更新完了画面を表示する
- 更新完了画面には見出し「パスワード再設定」、文言「パスワードを変更しました。」、トップページへ戻る「戻る」リンクを表示する

# 現在の挙動【必須】
- ec-cube-enterpriseでは、パスワード更新後に完了画面をrenderせず、flashに「パスワードを更新しました。」を積んでログイン画面(mypage_login)へリダイレクトしている。

ec-cube-enterprise 更新成功後のリダイレクト: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:211-215`
```php
                // 完了メッセージを設定
                $this->addFlash('password_reset_complete', trans('front.forgot.reset_complete'));

                // ログインページへリダイレクト
                return $this->redirectToRoute('mypage_login');
```

ec-cube-enterprise ログイン画面のフラッシュ表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:88-90`
```twig
                                {% for reset_complete in app.session.flashbag.get('password_reset_complete') %}
                                    <p class="p-hareruya-login__flash">{{ reset_complete|trans }}</p>
                                {% endfor %}
```

ec-cube-enterprise 実装文言: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:500-501`
```yaml
front.forgot.reset_title: パスワード再設定
front.forgot.reset_complete: パスワードを更新しました。
```
- ベース実装(pf-eccube3)では、/forgot/resetcomplete/{resetKey} を独立ルートとして持ち、更新成功時に Forgot/resetcomplete.twig をrenderして完了画面を表示している。

ベース実装 pf-eccube3 完了画面ルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:116-121`
```php
        $c->match('/forgot', '\Plugin\HareruyaEc\Controller\ForgotController::index')
            ->bind('forgot');
        $c->match('/forgot/reset/{resetKey}', '\Plugin\HareruyaEc\Controller\ForgotController::reset')
            ->bind('forgot_reset');
        $c->match('/forgot/resetcomplete/{resetKey}', '\Plugin\HareruyaEc\Controller\ForgotController::resetComplete')
            ->bind('forgot_resetcomplete');
```

ベース実装 pf-eccube3 更新成功後の完了画面render: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php:150-157`
```php
        // パスワードを更新
        $app['orm.em']->persist($customer);
        $app['orm.em']->flush();

        // ログ出力
        $app['monolog']->addInfo('reset password complete:' . "{$customer->getId()} {$customer->getEmail()} {$request->getClientIp()}");

        return $app->render('Forgot/resetcomplete.twig');
```

ベース実装 pf-eccube3 完了画面テンプレート: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Forgot/resetcomplete.twig:4-12`
```twig
<div class="event-main-middle-wrapper">
    <h1 class="common-headline">パスワード再設定</h1>
    <div class="contents ask-pass">
        <p>パスワードを変更しました。</p>
        <div class="submit-button-wrapper">
            <div class="submit-button-container">
                <a href="{{ url('homepage') }}" class="submit-button submit-button-back submit-button-complete">
                    戻る
                </a>
```

# 根拠
- 設計：
  - 更新成功時は完了画面を表示: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2461-2465`
  - 画面遷移の更新完了画面要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2513-2514`
- ec-cube-enterprise：
  - 更新成功後はログイン画面へリダイレクト: `ec-cube-enterprise/src/Eccube/Controller/Front/ForgotController.php:211-215`
  - ログイン画面でフラッシュ表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:88-90`
- ベース実装：
  - 完了画面ルート: `pf-eccube3/app/Plugin/HareruyaEc/ControllerProvider/FrontControllerProvider.php:116-121`
  - 完了画面render: `pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php:150-157`
  - 完了画面テンプレート: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Forgot/resetcomplete.twig:4-12`

# 確認メモ
- 確認コマンド: `rg -n "F06-04|f06-04|forgot_reset|resetcomplete|パスワード再発行|パスワード変更完了" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html`
- 確認コマンド: `rg -n "class Forgot|forgot_reset|password_reset_complete|reset_complete|redirectToRoute\\('mypage_login|パスワードを更新しました|front.forgot.reset_complete" ec-cube-enterprise/src/Eccube/Controller/Front ec-cube-enterprise/src/Eccube/Resource/template/default/Forgot ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Controller/ForgotController.php | sed -n '125,175p'`
- ec-cube-enterpriseにはForgot/resetcomplete相当の完了画面テンプレート遷移がなく、更新成功時はログイン画面にフラッシュを表示する実装になっている。
- 設計とベース実装の文言は「パスワードを変更しました。」だが、ec-cube-enterpriseのフラッシュ文言は「パスワードを更新しました。」である。

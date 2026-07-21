/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：ログイン
課題カテゴリ：実装漏れ
課題：ログイン試行制限中もメールアドレス・パスワード入力欄とログインボタンが表示される
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. `http://localhost:8080/ja/mypage/login` で同一条件のログイン失敗を5回発生させ、Symfony の `login_throttling` 制限状態にする
2. 制限状態で `http://localhost:8080/ja/mypage/login` を表示、または再度ログイン送信する
3. メールアドレス欄・パスワード欄・ログインボタンと、ログイン制限メッセージの表示状態を確認する

# 期待される挙動【必須】
- ログイン制限中（制限日時が現在より後）の場合は、フォーム位置に制限メッセージのみを表示する
- 制限中はメールアドレス欄、パスワード欄、Remember Me欄、ログインボタンを表示しない
- 制限中の表示文言は「誤ったメールアドレスやパスワードを繰り返し入力されたため、ログインを制限しました。<br>しばらく待ってから、お試しください。」とする

# 現在の挙動【必須】
- ec-cube-enterprise は `security.yaml` で Symfony の `login_throttling` を有効にし、`eccube.yaml` で上限5回・30分を設定している。一方、会員ログイン画面の `MypageController::login()` は制限日時や入力欄非表示フラグをテンプレートへ渡しておらず、`Mypage/login.twig` はメールアドレス欄、パスワード欄、ログインボタンを常時描画する。制限時は認証エラーがある場合にエラー枠へ Symfony の `Too many failed login attempts` 翻訳を表示するだけで、設計の「入力欄に代えて制限メッセージのみ表示」にはなっていない。

ec-cube-enterprise ログイン画面は制限状態フラグを渡していない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:83-117`
```php
    #[Route(path: '/mypage/login', name: 'mypage_login', methods: ['GET', 'POST'])]
    #[Template(template: 'Mypage/login.twig')]
    public function login(Request $request, AuthenticationUtils $utils): RedirectResponse|array
    {
        if ($this->isGranted('IS_AUTHENTICATED_FULLY')) {
            log_info('認証済のためログイン処理をスキップ');

            return $this->redirectToRoute('mypage');
        }

        $builder = $this->formFactory
            ->createNamedBuilder('', CustomerLoginType::class);

        if ($this->isGranted('IS_AUTHENTICATED_REMEMBERED')) {
            $Customer = $this->getUser();
            if ($Customer instanceof Customer) {
                $builder->get('login_email')
                    ->setData($Customer->getEmail());
            }
        }

        $event = new EventArgs(
            [
                'builder' => $builder,
            ],
            $request
        );
        $this->eventDispatcher->dispatch($event, EccubeEvents::FRONT_MYPAGE_MYPAGE_LOGIN_INITIALIZE);

        $form = $builder->getForm();

        return [
            'error' => $utils->getLastAuthenticationError(),
            'form' => $form->createView(),
        ];
```

ec-cube-enterprise メールアドレス・パスワード入力欄を常時描画: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:46-67`
```twig
                                <div class="p-hareruya-login__form-fields">
                                    <div class="p-hareruya-login__form-group">
                                        <div class="c-hareruya-form-input">
                                            {{ form_widget(form.login_email, {'attr': form.login_email.vars.attr|merge({
                                                'class': 'c-hareruya-form-input__field',
                                                'style': 'ime-mode: disabled;',
                                                'placeholder': 'front.mypage.login.placeholder_mail'|trans,
                                                'autofocus': true,
                                                'autocomplete': 'email'
                                            })}) }}
                                        </div>
                                    </div>
                                    <div class="p-hareruya-login__form-group">
                                        <div class="c-hareruya-form-input">
                                            {{ form_widget(form.login_pass, {'attr': form.login_pass.vars.attr|merge({
                                                'class': 'c-hareruya-form-input__field',
                                                'placeholder': 'common.password'|trans,
                                                'autocomplete': 'current-password'
                                            })}) }}
                                        </div>
                                    </div>
                                </div>
```

ec-cube-enterprise 制限エラーは入力欄の後にエラー枠として表示: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:77-89`
```twig
                                {% if error %}
                                    <div class="p-hareruya-login__form-error"{% if 'Too many failed login attempts' in error.messageKey %} data-error-code="too-many-login-attempts"{% endif %}>
                                        <div class="c-hareruya-form-input__field-error--server" role="alert" aria-live="polite">
                                            <p>{{ error.messageKey|trans(error.messageData, 'validators')|nl2br }}</p>
                                        </div>
                                    </div>
                                {% endif %}

                                <div class="p-hareruya-login__form-actions">
                                    <button type="submit" class="c-hareruya-btn c-hareruya-btn--lg c-hareruya-btn--primary u-hareruya-w-full">
                                        <span>{{ 'common.login'|trans }}</span>
                                        <i class="icon-hareruya-arrow-right c-hareruya-icon--md" aria-hidden="true"></i>
                                    </button>
```

ec-cube-enterprise ログイン試行制限の有効化: `ec-cube-enterprise/app/config/eccube/packages/security.yaml:62-63`
```yaml
            login_throttling:
                limiter: app.login_rate_limiter
```

ec-cube-enterprise ログイン試行制限の回数と時間: `ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:283-284`
```yaml
    eccube_login_throttling_max_attempts: 5
    eccube_login_throttling_interval: '30 minutes'
```

ec-cube-enterprise Symfony制限メッセージ翻訳: `ec-cube-enterprise/src/Eccube/Resource/locale/validators.ja.yaml:25-27`
```yaml
Too many failed login attempts, please try again later.: ログイン試行回数を超えました。しばらくして再度お試しください。
Too many failed login attempts, please try again in %minutes% minute.: ログイン試行回数が多すぎます。%minutes%分後に再度お試しください。
Too many failed login attempts, please try again in %minutes% minutes.: ログイン試行回数が多すぎます。%minutes%分後に再度お試しください。
```
- ベース実装 pf-eccube3 では、ログイン失敗回数が上限に達すると `FrontLoginFailureHandler` がセッションの `customer.login.restriction_datetime` に制限日時を保存する。会員ログイン画面 `Mypage/login.twig` はこの日時が現在より後なら制限メッセージだけを表示し、入力欄・エラー枠・ログインボタン・CSRF hidden は `{% else %}` 側に置かれているため表示されない。成功時は `FrontLoginSuccessHandler` が失敗回数と制限日時を削除する。

ベース実装 pf-eccube3 制限日時セッションキー: `pf-eccube3/app/Plugin/HareruyaEc/config.yml:335-339`
```yaml
    security:
        login_retry_count: customer.login.retry.count
        login_retry_limit: 10
        login_restriction_datetime: customer.login.restriction_datetime
        login_restriction_minutes: 10
```

ベース実装 pf-eccube3 失敗上限到達時に制限日時を保存: `pf-eccube3/app/Plugin/HareruyaEc/Service/Security/FrontLoginFailureHandler.php:26-34`
```php
        // ログイン失敗回数を設定・追加
        $retryCount = $session->get($app['config']['HareruyaEc']['const']['security']['login_retry_count'], 0) + 1;
        $session->set($app['config']['HareruyaEc']['const']['security']['login_retry_count'], $retryCount);
        // ログイン失敗回数が一定数以上になったらログイン制限時間を設定して失敗回数をリセット
        if ($retryCount >= $app['config']['HareruyaEc']['const']['security']['login_retry_limit']) {
            $limitDateTime = new \DateTime();
            $limitDateTime->modify("+{$app['config']['HareruyaEc']['const']['security']['login_restriction_minutes']} minute"); 
            $session->set($app['config']['HareruyaEc']['const']['security']['login_restriction_datetime'], $limitDateTime);
            $session->remove($app['config']['HareruyaEc']['const']['security']['login_retry_count']);
```

ベース実装 pf-eccube3 制限中はメッセージのみ表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig:19-24`
```twig
                        {% set loginTime = app.session.get(app.config.HareruyaEc.const.security.login_restriction_datetime)|default(null) %}
                        {% if loginTime is not null and loginTime > date() %}
                            <div id="mypage_login_box__error_message" class="form-group loginform__text">
                                <span class="text-danger">誤ったメールアドレスやパスワードを繰り返し入力されたため、ログインを制限しました。<br>しばらく待ってから、お試しください。</span>
                            </div>
                        {% else %}
```

ベース実装 pf-eccube3 入力欄とボタンは制限中でない場合だけ表示: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig:24-51`
```twig
                        {% else %}
                        <ul class="loginform__usrdata-list">
                            <li class="loginform__usrdata">
                                {{ form_widget(form.login_email, {'attr': {'style' : 'ime-mode: disabled;', 'placeholder' : 'メールアドレス', 'autofocus': true}}) }}
                            </li>
                            <li class="loginform__usrdata">
                                {{ form_widget(form.login_pass,  {'attr': {'placeholder' : 'パスワード' }}) }}
                                {% if BaseInfo.option_remember_me %}
                                    {% if is_granted('IS_AUTHENTICATED_REMEMBERED') %}
                                        <input id="mypage_login_box__login_memory" type="hidden" name="login_memory" value="1">
                                    {% else %}
                                        {{ form_widget(form.login_memory) }}
                                    {% endif %}
                                {% endif %}
                            </li>
                        </ul>
                            {% if error %}
                            <div id="mypage_login_box__error_message" class="form-group">
                                <span class="text-danger">{{ error|trans|raw }}</span>
                            </div>
                            {% endif %}
                        <div class="submit-button-wrapper">
                            <div class="submit-button-container">
                                <input type="submit" tabindex="1" value="ログイン" class="submit-button submit-button-forward">
                            </div>
                        </div>
                        <input type="hidden" name="_csrf_token" value="{{ csrf_token('authenticate') }}">
                        {% endif %}
```

ベース実装 pf-eccube3 成功時に制限日時を削除: `pf-eccube3/app/Plugin/HareruyaEc/Service/Security/FrontLoginSuccessHandler.php:21-29`
```php
    public function onAuthenticationSuccess( Request $request, TokenInterface $token)
    {
        $app = $this->app;
        // ログイン失敗回数とログイン制限日時をリセット
        $session = $request->getSession();
        $session->remove($app['config']['HareruyaEc']['const']['security']['login_retry_count']);
        $session->remove($app['config']['HareruyaEc']['const']['security']['login_restriction_datetime']);

        return parent::onAuthenticationSuccess($request, $token);
```

# 根拠
- 設計：
  - 制限状態のときは入力欄を出さず制限メッセージのみ表示: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2033-2034`
  - ログイン送信時の判定順序でも入力欄を出さないと規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2046-2048`
  - 制限メッセージ文言と表示位置: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2050-2056`
- ec-cube-enterprise：
  - 入力欄とログインボタンが常時描画される: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:46-89`
  - ログイン画面コントローラは制限中判定や入力欄非表示フラグを渡していない: `ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php:83-117`
- ベース実装：
  - pf-eccube3は制限日時が現在より後なら制限メッセージだけを表示する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig:19-51`
  - pf-eccube3は失敗上限到達時に制限日時をセッションへ保存する: `pf-eccube3/app/Plugin/HareruyaEc/Service/Security/FrontLoginFailureHandler.php:26-34`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json#f06-03_0306_sheet-5_sheet-conformance-eee0826d789c'`
- 確認コマンド: `rg -n "制限状態のときは入力欄を出さず|ログイン制限中|入力欄を表示せず|フォーム位置に入力欄に代えて表示|制限中は入力欄を表示しない" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html`
- 確認コマンド: `rg -n "Too many failed login attempts|login_throttling|login_rate_limiter|eccube_login_throttling|max_attempts|login_email|login_pass|too-many-login-attempts" ec-cube-enterprise/src/Eccube ec-cube-enterprise/app/config/eccube/packages`
- 確認コマンド: `rg -n "login_restriction_datetime|login_retry_count|ログインを制限しました|FrontLoginFailureHandler|FrontLoginSuccessHandler|login_retry_limit|login_restriction_minutes" pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '2033,2056p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/Front/Mypage/MypageController.php | sed -n '83,117p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig | sed -n '38,96p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/app/config/eccube/packages/security.yaml | sed -n '55,67p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/app/config/eccube/packages/eccube.yaml | sed -n '280,285p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/validators.ja.yaml | sed -n '23,28p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig | sed -n '19,51p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Service/Security/FrontLoginFailureHandler.php | sed -n '1,55p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Service/Security/FrontLoginSuccessHandler.php | sed -n '1,40p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/config.yml | sed -n '334,340p'`

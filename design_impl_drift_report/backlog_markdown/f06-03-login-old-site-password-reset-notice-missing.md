/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：フロント会員
機能：ログイン
課題カテゴリ：実装漏れ
課題：会員ログイン画面に旧サイト会員向けのパスワード再設定案内が表示されない
設計書：0306_基本設計仕様書(フロント_会員).xlsx

# 再現手順【必須】
1. `http://localhost:8080/ja/mypage/login` を表示する
2. 「会員の方」「初めてご利用の方」の周辺に、旧サイト会員向けのパスワード再設定案内が表示されるか確認する
3. 案内文「旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い」と、再設定ページへのリンク有無を確認する

# 期待される挙動【必須】
- 会員ログイン画面に、旧サイト会員向けのパスワード再設定案内を常時表示する
- 案内文は「旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い」「システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。」を表示する
- 案内からパスワード再設定ページへ遷移できるリンクを表示する

# 現在の挙動【必須】
- ec-cube-enterprise の会員ログイン画面は `Mypage/login.twig` で「会員ログイン」セクションと「新規会員」セクションだけを描画しており、旧サイト会員向け案内に相当する `loginreminder` ブロックや文言はない。`messages.ja.yaml` にも `front.mypage.login.*` の既存文言は会員ログイン、新規会員、パスワード忘れリンク、会員情報登録のみで、旧サイト会員向けパスワード再設定案内の翻訳キーはない。

ec-cube-enterprise 会員ログインセクション: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:29-97`
```twig
                        {# 会員ログイン #}
                        <section class="p-hareruya-login__section" aria-labelledby="hareruya-login-member-heading">
                            <h2 id="hareruya-login-member-heading" class="c-hareruya-heading--lev2">
                                {{ 'front.mypage.login.member_section_title'|trans }}
                            </h2>
                            <div class="p-hareruya-login__description">
                                <p class="c-hareruya-text">{{ 'front.mypage.login.member_lead'|trans }}</p>
                            </div>

                            <form name="login_mypage" id="login_mypage" method="post" action="{{ url('mypage_login') }}" class="p-hareruya-login__form">
                                {% if app.session.flashBag.has('eccube.login.target.path') %}
                                    {% for targetPath in app.session.flashBag.peek('eccube.login.target.path') %}
                                        <input type="hidden" name="_target_path" value="{{ targetPath }}">
                                    {% endfor %}
                                {% endif %}
                                <input type="hidden" name="_failure_path" value="{{ login_failure_path|default(path('mypage_login')) }}">

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

                                {% if BaseInfo.option_remember_me %}
                                    <input type="hidden" name="login_memory" value="1">
                                {% endif %}

                                {% for reset_complete in app.session.flashbag.get('password_reset_complete') %}
                                    <p class="p-hareruya-login__flash">{{ reset_complete|trans }}</p>
                                {% endfor %}

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
                                    <p class="c-hareruya-text">
                                        <a class="c-hareruya-text--link" href="{{ url('forgot') }}">{{ 'front.mypage.login.forgot_password'|trans }}</a>
                                    </p>
                                </div>

                                <input type="hidden" name="_csrf_token" value="{{ csrf_token('authenticate') }}">
                            </form>
                        </section>
```

ec-cube-enterprise 新規会員セクションで画面が終了: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:99-123`
```twig
                        {# 新規会員 #}
                        <section class="p-hareruya-login__section" aria-labelledby="hareruya-login-guest-heading">
                            <h2 id="hareruya-login-guest-heading" class="c-hareruya-heading--lev2">
                                {{ 'front.mypage.login.guest_section_title'|trans }}
                            </h2>
                            <div class="p-hareruya-login__description">
                                {% for line in 'front.mypage.login.guest_lead'|trans|trim|split('\n') %}
                                    {% set paragraph = line|trim %}
                                    {% if paragraph is not empty %}
                                        <p class="c-hareruya-text">{{ paragraph }}</p>
                                    {% endif %}
                                {% endfor %}
                            </div>
                            <div class="p-hareruya-login__register-action">
                                <a class="c-hareruya-btn c-hareruya-btn--lg c-hareruya-btn--primary u-hareruya-w-full" href="{{ url('entry') }}">
                                    <span>{{ 'front.mypage.login.register'|trans }}</span>
                                    <i class="icon-hareruya-arrow-right c-hareruya-icon--md" aria-hidden="true"></i>
                                </a>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
{% endblock %}
```

ec-cube-enterprise ログイン画面の翻訳キーに旧サイト案内がない: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:630-638`
```yaml
front.mypage.login.member_section_title: 会員の方
front.mypage.login.placeholder_mail: メールアドレス
front.mypage.login.member_lead: メールアドレスとパスワードを入力してログインしてください。
front.mypage.login.guest_section_title: 初めてご利用の方
front.mypage.login.guest_lead: |
  初めてご利用のお客様は、こちらから会員登録を行ってください。
  メールアドレスとパスワードを登録しておくと便利にお買い物ができる様になります。
front.mypage.login.forgot_password: パスワードお忘れの方はこちら
front.mypage.login.register: 会員情報登録
```
- ベース実装 pf-eccube3 の会員ログイン画面では、「初めてご利用の方」ブロックの後に `div.loginreminder` を描画し、旧サイト会員向けのタイトル、説明文、`forgot` への「パスワード再設定ページへ」リンクを表示している。Shopping/Purchase のログイン画面にも同じ案内ブロックが存在する。

ベース実装 pf-eccube3 会員ログイン画面の旧サイト会員向け案内: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig:60-80`
```twig
            <div class="loginform">
                <h2 class="loginform__title">初めてご利用の方</h2>
                <div class="loginform__content">
                    <p class="loginform__text">初めてご利用のお客様は、こちらから会員登録を行って下さい。<br>
                    メールアドレスとパスワードを登録しておくと便利にお買い物ができるようになります。</p>

                    <div class="submit-button-wrapper">
                        <div class="submit-button-container">
                            <a href="{{ path('entry') }}" class="submit-button submit-button-forward">
                                会員情報登録
                            </a>
                        </div>
                    </div>

                </div>
            </div>
            <div class="loginreminder">
                <p class="loginreminder__title">旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い</p>
                <p>システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。</p>
                <p><a class="loginreminder__link" href="{{ path('forgot') }}">パスワード再設定ページへ</a></p>
            </div>
```

ベース実装 pf-eccube3 購入ログイン画面にも同じ案内: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/login.twig:74-78`
```twig
            <div class="loginreminder">
                <p class="loginreminder__title">旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い</p>
                <p>システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。</p>
                <p><a class="loginreminder__link" href="{{ path('forgot') }}">パスワード再設定ページへ</a></p>
            </div>
```

ベース実装 pf-eccube3 買取ログイン画面にも同じ案内: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/login.twig:77-81`
```twig
            <div class="loginreminder">
                <p class="loginreminder__title">旧サイトで会員登録がお済みの方へ、パスワード再設定のお願い</p>
                <p>システムの移行に伴い、新サイトに初めてログインする際には「パスワード」の再設定をお願いします。</p>
                <p><a class="loginreminder__link" href="{{ path('forgot') }}">パスワード再設定ページへ</a></p>
            </div>
```

# 根拠
- 設計：
  - ログイン画面の表示要素として旧サイト会員向け案内を要求: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2033`
  - 常時表示メッセージとして案内文言を規定: `hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:2050-2053`
- ec-cube-enterprise：
  - ログイン画面は会員ログインと新規会員の2セクションのみで旧サイト案内を描画しない: `ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig:29-123`
  - ログイン画面翻訳キーにも旧サイト案内がない: `ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:630-638`
- ベース実装：
  - pf-eccube3はMypageログイン画面に旧サイト会員向け案内を表示する: `pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig:76-80`

# 確認メモ
- 確認コマンド: `python3 design_impl_drift_report/backlog_factcheck_workflow.py review-pack --key 'hareruya-design-docs/design_impl_drift_report/findings/f06-03_0306_sheet-5_sheet.json#f06-03_0306_sheet-5_sheet-conformance-c50e3d0555e3'`
- 確認コマンド: `rg -n "旧サイト|パスワード再設定のお願い|システムの移行|新サイトに初めてログイン|パスワード.*再設定" hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html ec-cube-enterprise/src/Eccube ec-cube-enterprise/html pf-eccube3/app/Plugin/HareruyaEc`
- 確認コマンド: `rg -n "front\.mypage\.login\.(member|guest|forgot|register|placeholder)|旧サイト|システムの移行|パスワード再設定のお願い" ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig`
- 確認コマンド: `nl -ba hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書\(フロント_会員\).html | sed -n '2033,2055p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/template/default/Mypage/login.twig | sed -n '1,125p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml | sed -n '628,639p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Mypage/login.twig | sed -n '1,95p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Shopping/login.twig | sed -n '70,80p'`
- 確認コマンド: `nl -ba pf-eccube3/app/Plugin/HareruyaEc/Resource/template/default/Purchase/login.twig | sed -n '73,81p'`

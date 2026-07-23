# B0候補: m01-02 管理画面 二段階認証 — 実行可能グレード候補（母集合81全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前）**／ B0バッチ1（具体化先行の量産・標準・実装なし）。
> **codexレビュー: R1要修正（Blockerなし・Major1）→是正済み**＝§9の既知500影響行台帳にC-040を追加し
> **17論理行（＋-EN従属6＝物理23行）の正規リスト**を単一の正として本文〔既知500〕マークと完全一致させた。
> excluded=25妥当・偽陰性なし・捏造ゼロ・既知500の期待値不変はcodex確認済み（維持）。
> O5未確定・source_class=standard-src+design は fid_kubun.tsv（D1）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> 実装・実走なし。fixture_version は全て `@TBD-D5`。
> 統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（改訂2・B0）。
> 正典（型）: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`＋承認済み候補4本
> （m09-01/m05-16/m10-11/m03-11・`REVIEW_LEDGER.md`）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m01-02_admin_login_two_factor_auth_oracle_draft.json`。
> **正式パス `e2e/fixtures/oracle/` 直下には書かない**。
> **既知の実装バグ（500系）**: 既存E2E実行（2026-07-06・16〇14×）で検出済みの
> TwoFactorAuthController::set()/edit() 戻り値型不整合は「乖離検出」として§9に不具合候補分離。
> **期待値は一次資料（設計書・ee標準ソース）側のまま**とし、実装バグに合わせない。
> **行数集計**: 候補ケース行総数**56**＝bound対応49（ja38＋-EN11）＋補完7（ja5＋-EN2）。
> 母集合81全数会計＝bound 56／TBD 0／excluded 25（§8）。

## §0 版固定

- 設計書 `functions/ec-cube-enterprise/m01-02_admin_login_two_factor_auth.md`
  （最終コミット ec17cd0・リポジトリHEAD d1e94c5。以下「md:行」。全489行）。
- ee `/home/y-saito/Developments/ec-cube-enterprise` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`。
  symfony/validator **v7.4.3**・robthree/twofactorauth **1.8.2**（composer.lock実測）。
- fid_kubun.tsv（D1・SHA 44fbf02f1e4c…）: `M01-02｜二段階認証｜対象｜標準｜standard-src+design｜区分不明=0`
  → **標準＝ee実ソース直接可＋設計書md**（暫定付与・確定はD6）。
- 母集合: baseline `integration_test/all_it_cases.tsv`（SHA 7911f190d273…）M01-02全**81行**
  （IT-M01-02-ADMIN-LOGIN-TWO-FACTOR-AUTH-001〜081。以下「-nnn」）。
- **判定原則（W0教訓1）**: 観点ラベルはノイズ。bindは各行の**「期待結果」実テキスト**で判定
  （§8に全81行の期待要旨を併記し極性も期待テキストで確認）。
- 主要一次資料の略記:
  - Controller = `src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php`
  - Listener = `src/Eccube/EventListener/TwoFactorAuthListener.php`
  - Service = `src/Eccube/Service/TwoFactorAuthService.php`
  - Type = `src/Eccube/Form/Type/Admin/TwoFactorAuthType.php`
  - auth.twig = `src/Eccube/Resource/template/admin/two_factor_auth.twig`
  - set.twig = `src/Eccube/Resource/template/admin/two_factor_auth_set.twig`
  - edit.twig = `src/Eccube/Resource/template/admin/Setting/System/two_factor_auth_edit.twig`
  - login_frame = `src/Eccube/Resource/template/admin/login_frame.twig`／default_frame = 同 `default_frame.twig`
  - member.twig = `…/admin/Setting/System/member.twig`／member_edit.twig = 同 `member_edit.twig`
  - MemberType = `src/Eccube/Form/Type/Admin/MemberType.php`／MemberController = `…/System/MemberController.php`
  - Entity = `src/Eccube/Entity/Member.php`
  - ja/en = `src/Eccube/Resource/locale/messages.{ja,en}.yaml`・`validators.{ja,en}.yaml`
  - xlf = `vendor/symfony/validator/Resources/translations/validators.{ja,en}.xlf`
  - LengthValidator = `vendor/symfony/validator/Constraints/LengthValidator.php`／Length = 同 `Length.php`
  - eccube.yaml = `app/config/eccube/packages/eccube.yaml`／security.yaml = 同 `security.yaml`／
    framework.yaml = 同 `framework.yaml`
  - rate(prod) = `app/config/eccube/packages/prod/eccube_rate_limiter.yaml`／rate(既定) = `app/config/eccube/packages/eccube_rate_limiter.yaml`
  - RateLimiterListener = `src/Eccube/EventListener/RateLimiterListener.php`／ExceptionListener = 同 `ExceptionListener.php`
  - totp.ts = `e2e/helpers/totp.ts`（TOTP生成・mismatchTotp）

## §1 L1原子オラクル表

全42claim。en文言はen一次資料逐語（ja翻訳ゼロ）。観測層は§7に併記。
Cookie名・値・秘密鍵原値は仕様非固定（md:49-63）＝名称一致では判定しない。秘密鍵原値は本書に書かない
（既知シードの鍵は `e2e/seed/sets/m01/*.sql` とテスト環境変数が正）。

| oracle_id | 観点 | claim | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|
| L1-M0102-001 | auth_rule | 未ログインで `/auth`・`/set`・`/edit` の各URLへアクセスすると admin_login のログイン画面へリダイレクト（到達不可） | `admin:`…`form_login:`…`login_path: admin_login`／「未ログインで管理者でない \| 管理ログインの対象。」 | security.yaml:40-47／md:370 | 0 |
| L1-M0102-002 | nav | 管理画面リクエストで個別2FA ON・認証済みCookie無効・**秘密鍵あり**なら追加認証画面へ302リダイレクト | `if ($Member->getTwoFactorAuthKey()) { $url = $this->router->generate('admin_two_factor_auth', …); }`…`$event->setController(fn () => new RedirectResponse($url, $status = 302));` | Listener:74-82,88／md:150（判定順序#7） | 0 |
| L1-M0102-003 | nav | 同条件で**秘密鍵なし**なら初回設定画面へ302リダイレクト | `else { $url = $this->router->generate('admin_two_factor_auth_set', …); }` | Listener:84-88／md:151（判定順序#8） | 0 |
| L1-M0102-004 | nav | 追加認証画面自身へのリクエストはガード対象外（後続処理を実行） | `public const ROUTE_EXCLUDE = ['admin_two_factor_auth'];`…`if (in_array($route, self::ROUTE_EXCLUDE)) { return; }` | Listener:31,59-62／md:145（判定順序#2） | 0 |
| L1-M0102-005 | nav | 初回設定画面へのリクエストは当該管理者の秘密鍵**未設定時のみ**ガード対象外（設定済みなら対象） | `public const ROUTE_EXCLUDE_WHEN_NOT_CONFIGURED = ['admin_two_factor_auth_set'];`…`if ($Member instanceof Member && !$Member->getTwoFactorAuthKey()) { return; }` | Listener:36,66-72／md:146-147（判定順序#3/#4） | 0 |
| L1-M0102-006 | nav | 秘密鍵設定済み管理者の `/set` アクセスは追加認証画面へリダイレクト（未認証での再設定防止・専用メッセージなし） | `// 既に2FAキーが設定されている場合は、認証画面にリダイレクト`…`if ($Member->getTwoFactorAuthKey()) { return $this->redirectToRoute('admin_two_factor_auth'); }` | Controller:91-95／md:296,414,252 | 0 |
| L1-M0102-007 | nav | システム2FA無効または認証済みCookie有効の状態で `/auth`・`/set` へ直接アクセスするとホーム画面相当へリダイレクト（専用メッセージなし） | `if (!$this->twoFactorAuthService->isEnabled() \|\| $this->twoFactorAuthService->isAuth($Member)) { return $this->redirectToRoute('admin_homepage'); }` | Controller:46-48（auth）,87-89（set）／md:118,126,251 | 0 |
| L1-M0102-008 | nav | 個別2FAがOFFの管理者には追加認証を誘導しない（保護画面をそのまま利用可） | `$Member->isTwoFactorAuthEnabled() && !$this->twoFactorAuthService->isAuth($Member)`（false時はsetControllerせず素通し）／「管理者、個別 2FA OFF \| 利用可。」 | Listener:74-78／md:148,294,371 | 0 |
| L1-M0102-009 | nav | システム2FAが無効（`eccube_2fa_enabled`='0'/false）なら誘導を一切行わない | `if (!$this->twoFactorAuthService->isEnabled()) { return; }`／`if (is_string($enabled) && $enabled === '0' \|\| $enabled === false) { return false; }` | Listener:55-57／Service:125-133／eccube.yaml:23,252／md:144,293,372 | 0 |
| L1-M0102-010 | nav | 本人再設定画面は認証済みCookieが無効ならホーム画面相当へリダイレクト（その後ガードで追加認証等へ誘導・専用メッセージなし） | `if (!$this->twoFactorAuthService->isAuth($Member)) { return $this->redirectToRoute('admin_homepage'); }` | Controller:106-108／md:134,297,253 | 0 |
| L1-M0102-011 | nav+cookie | 追加認証で6桁トークンがDBの秘密鍵と一致するとホーム画面相当（admin_homepage）へリダイレクトし認証済みCookieを付与 | `if ($this->twoFactorAuthService->verifyCode($Member->getTwoFactorAuthKey(), $form->get('device_token')->getData())) { $response = new RedirectResponse($this->generateUrl('admin_homepage')); $response->headers->setCookie($this->twoFactorAuthService->createAuthedCookie($Member)); return $response; }` | Controller:58-63／md:121,88 | 0 |
| L1-M0102-012 | message | 追加認証失敗（TOTP不一致・フォーム不正とも同一）: ja「トークンに誤りがあります。再度入力してください。」／en "There is an error in the token. Please try again."（同一画面 `.text-danger` に表示・滞留） | `$error = trans('admin.setting.system.two_factor_auth.invalid_message__reinput');`（両分岐）／`…invalid_message__reinput: トークンに誤りがあります。再度入力してください。` | Controller:64-66,70-72／ja:3227／en:2858／auth.twig:27-29／md:180,256,408-409 | 1 |
| L1-M0102-013 | message | 初回設定・本人再設定のフォーム不正（未入力・6桁数字以外）: ja「トークンに誤りがあります。数字6桁で入力してください。」／en "There is an error in the token. Please enter in 6 digits." | `$error = trans('admin.setting.system.two_factor_auth.invalid_message__invalid');`／`…invalid_message__invalid: トークンに誤りがあります。数字6桁で入力してください。` | Controller:153-155／ja:3228／en:2859／md:193,209,410 | 1 |
| L1-M0102-014 | message | 初回設定・本人再設定でフォーム妥当だがTOTP不一致: reinput文言（L1-012と同文言）を表示し同一画面に留まる | `if ($this->twoFactorAuthService->verifyCode($auth_key, $device_token)) {…} else { $error = trans('…invalid_message__reinput'); }` | Controller:141-152／md:192,208,411 | 0 |
| L1-M0102-015 | db_effect | 初回設定・本人再設定の検証成功時、`dtb_member.two_factor_auth_key` へ hidden の秘密鍵候補値を保存（persist/flush即時確定・削除は行わない） | `$Member->setTwoFactorAuthKey($auth_key); $this->memberRepository->save($Member);`／「two_factor_auth_key（TOTP 秘密鍵）を更新する。persist/flush で即時確定する。本機能では削除は行わない。」 | Controller:143-144／md:352 | 0 |
| L1-M0102-016 | message | 初回設定・本人再設定の成功フラッシュ: ja「2段階認証の設定が完了しました。」／en "Two-factor authentication setting is complete."（adminフラッシュ名前空間・ホーム画面相当で表示） | `$this->addSuccess('admin.setting.system.two_factor_auth.complete_message', 'admin');`／`$this->addFlash('eccube.'.$namespace.'.success', $message);` | Controller:145／AbstractController.php:107-110／ja:3226／en:2857／md:216,267 | 1 |
| L1-M0102-017 | message | 本人再設定画面のGETで秘密鍵が既にDBにあるとき警告: ja「既に2段階認証の設定が行われています。再設定すると登録済みのデバイスが使用出来なくなります。」／en "Two-factor authentication has already been set. If you reset it, you will not be able to use the registered device."（本人の再設定画面のみ＝/setは鍵ありだと事前にL1-006でリダイレクト） | `if ($Member->getTwoFactorAuthKey()) { $this->addWarning('admin.setting.system.two_factor_auth.configured_warning', 'admin'); }` | Controller:129-132／AbstractController.php:137-140／ja:3225／en:2856／md:207,266 | 1 |
| L1-M0102-018 | validation | device_token は `NotBlank`＋`Length(min=6,max=6)`＋`attr maxlength=6`（text型・必須） | `'constraints' => [ new Assert\NotBlank(), new Assert\Length([ 'max' => 6, 'min' => 6, ]), ], 'attr' => [ 'maxlength' => 6, …]` | Type:32-48／md:284,360 | 0 |
| L1-M0102-019 | message | NotBlankのフィールド検証文言: ja「入力されていません。」／en "No value found."（トークン欄直下 `form_errors` に併記されうる） | `This value should not be blank.: 入力されていません。`／`This value should not be blank.: No value found.` | validators.ja.yaml:17／validators.en.yaml:17／auth.twig:36／set.twig:60／edit.twig:89／md:181,194,210 | 1 |
| L1-M0102-020 | message | Length(min=max=6)違反（5桁・7桁とも）はexactMessage: ja「この値は6文字ちょうどで入力してください。」／en "This value should have exactly 6 characters."（min==max→exactMessage選択・`setPlural(6)`でcharacters側） | `$exactlyOptionEnabled = $constraint->min == $constraint->max; $builder = $this->context->buildViolation($exactlyOptionEnabled ? $constraint->exactMessage : $constraint->maxMessage);`…`->setPlural($constraint->max)`／`<target>この値は{{ limit }}文字ちょうどで入力してください。</target>`／`<target>This value should have exactly {{ limit }} character.\|This value should have exactly {{ limit }} characters.</target>`（ee validators.yamlに上書きなし=grep実測） | LengthValidator:71-74,85,91-95,106／Length.php:51／xlf ja:181-184／xlf en:181-184 | 1 |
| L1-M0102-021 | display_field | フォーム構成: 追加認証画面は `auth_key` を除去（device_token＋_tokenのみ）。初回設定・本人再設定は hidden `auth_key`（NotBlank必須）を持つ。DOM idはblock prefix `admin_two_factor_auth` 由来（`#admin_two_factor_auth_device_token`・`#admin_two_factor_auth_auth_key`・`#admin_two_factor_auth__token`） | `$builder->remove('auth_key');`／`->add('auth_key', HiddenType::class, ['required' => true, 'constraints' => [new Assert\NotBlank(),],]);`／`return 'admin_two_factor_auth';` | Controller:51-53／Type:49-55,61-65／set.twig:48／edit.twig:51／md:103,285,361 | 0 |
| L1-M0102-022 | display_field | 追加認証画面: 見出しh5 ja「2段階認証」／en "Two-factor auth"・トークン欄プレースホルダ ja「トークン」／en "Token"・送信ボタン ja「認証」／en "Authentication" | `<h5 class="mb-3">{{ 'admin.setting.system.two_factor_auth_title'\|trans }}</h5>`…`'placeholder': 'admin.setting.system.two_factor_auth.device_token'`…`<button type="submit" …>{{ 'admin.setting.system.two_factor_auth.auth'\|trans }}</button>` | auth.twig:25,34,39／ja:3221,3223,3224／en:2852,2854,2855／md:171,178-179 | 1 |
| L1-M0102-023 | display_field | 初回設定画面: QR説明文 ja「QRコードを2段階認証用スマートフォンアプリで読み込み、表示された6桁の数字を入力してください。」／en "Please read the QR code with the two-factor authentication app."・QR描画領域 `#qrcode`（otpauth://totp URIに `secret={auth_key}` を含む）・送信ボタン ja「登録」／en "Register" | `<p class="mb-3 text-start">{{ 'tooltip.setting.system.two_factor_auth.qr_code'\|trans }}</p>`…`<div id="qrcode" class="mb-3"></div>`／`text: 'otpauth://totp/…?secret={{ auth_key }}&issuer=…'`／`{{ 'admin.common.registration'\|trans }}` | set.twig:50,51,21,63／ja:3685,1629／en:3297,1661／md:189-191 | 1 |
| L1-M0102-024 | display_field | 本人再設定画面の `<title>` は「システム設定 2段階認証 - {店舗名}」（default_frameのtitle合成: sub_title「システム設定」＋title「2段階認証」）／en "System Settings Two-factor auth - {店舗名}" | `<title>{{ block('sub_title') }} {{ block('title') }} - {{ BaseInfo.shop_name }}</title>`／`{% block title %}{{ 'admin.setting.system.two_factor_auth_title'\|trans }}{% endblock %} {% block sub_title %}{{ 'admin.setting.system'\|trans }}{% endblock %}` | default_frame.twig:17／edit.twig:15-16／ja:2987,3221／en:2674,2852／md:200-201 | 1 |
| L1-M0102-025 | display_field | 本人再設定画面: カード見出し「2段階認証」・行ラベル ja「QRコード」/en "QR code"・トークンラベル ja「トークン」/en "Token"＋「必須」/"Required" バッジ・行ツールチップ（QR説明文=L1-023と同文言）・送信ボタン「登録」/"Register" | `<span class="card-title">{{ '…two_factor_auth_title'\|trans }}</span>`…`{{ '…two_factor_auth.qr'\|trans }}`…`data-bs-toggle="tooltip" … title="{{ 'tooltip.setting.system.two_factor_auth.qr_code'\|trans }}"`…`<span class="badge bg-primary ms-1">{{ 'admin.common.required'\|trans }}</span>` | edit.twig:58,70,78-81,112-113／ja:3221,3222,3223,1721,3685,1629／en:2852,2853,2854,1749,3297,1661／md:203-206 | 1 |
| L1-M0102-026 | cookie | 認証済みCookieの属性: HttpOnly=true・path=ベースパス+管理ルートセグメント・expire=`eccube_2fa_expire` 日（既定14。0はセッション扱い）・Secure/SameSite(None)は `eccube_force_ssl` 連動。**Cookie名は仕様非固定**（`ECCUBE_2FA_COOKIE_NAME` 既定 `eccube_2fa`）＝名称一致では判定しない | `return new Cookie( $this->cookieName, …, $this->expire == 0 ? 0 : time() + ($this->expire * 24 * 60 * 60), $this->request->getBasePath().'/'.$this->eccubeConfig->get('eccube_admin_route'), null, $this->eccubeConfig->get('eccube_force_ssl') ? true : false, true, false, … );` | Service:29,34,55-62,102-112／eccube.yaml:23-25,252-254／md:60-63,471-480 | 0 |
| L1-M0102-027 | cookie | Cookie検証は「管理者IDと秘密鍵から導いたハッシュ一致＋date期限内」。**秘密鍵を更新すると旧鍵に基づくCookie・旧鍵由来トークンは無効**（ハッシュ不一致／verifyCode不一致） | `$hasher->verify($config->key, $Member->getId().$Member->getTwoFactorAuthKey())`…`$config->date > date('U', strtotime('-'.$this->expire.' day'))`／「秘密鍵を更新した場合、旧秘密鍵に基づく Cookie や認証アプリのトークンは有効な認証材料として扱われない。」 | Service:65-86,88-91／md:307,136 | 0 |
| L1-M0102-028 | integration | TOTP検証は `verifyCode($authKey, $token, 2)`＝許容ウィンドウ±2周期（RobThree既定 SHA1/30秒/6桁・秘密鍵はcreateSecret生成のbase32） | `return $this->tfa->verifyCode($authKey, $token, 2);`／`return $this->tfa->createSecret();`／「実装確認値は前後 2 ステップ（`TwoFactorAuthService::verifyCode` が `verifyCode($authKey, $token, 2)` を呼ぶ）」 | Service:53,115-118,120-123／md:310,274／totp.ts:1-10（生成ヘルパ根拠） | 0 |
| L1-M0102-029 | rate_limit | 追加認証POSTは**本番向け設定**でユーザー単位5回/30分（`admin_two_factor_auth`・type:user・POST）。超過時 `TooManyRequestsHttpException`（429）→エラー画面に ja「試行回数の上限を超過しました。しばらくお待ちいただき、再度お試しください。」／en "The maximum number of attempts has been exceeded. Please wait a moment and try again."。**既定(非prod)configには同limiter未定義=非活性（環境依存）**。初回設定・本人再設定のPOSTは対象外 | `admin_two_factor_auth: route: admin_two_factor_auth method: [ 'POST' ] type: user limit: 5 interval: '30 minutes'`／`if (!$limiter->consume()->isAccepted()) { throw new TooManyRequestsHttpException(); }`／`case 429: …$message = trans('exception.error_message_rate_limit');` | rate(prod):83-88／rate(既定):1-18（admin_two_factor_auth無し=実測）／RateLimiterListener:76-82／ExceptionListener:165-169／ja:3791／en:3402／md:243,420-428 | 1 |
| L1-M0102-030 | display_field | ヘッダユーザーメニュー内リンク ja「2段階認証 設定」／en "Two-Factor Auth" は**ログイン中管理者の個別2FAがONのときのみ**表示（/editへのリンク） | `{% if app.user.two_factor_auth_enabled %}…href='{{ url("admin_setting_system_two_factor_auth_edit") }}'…{{ 'admin.header.two_factor_auth'\|trans }}…{% endif %}` | default_frame.twig:184／ja:1897／en:1875／md:222 | 1 |
| L1-M0102-031 | display_field | メンバー一覧: 列見出し ja「2段階認証」／en "Two-factor auth"。個別2FAがONの行にのみ状態アイコンを表示し、ツールチップは鍵登録済みで ja「2段階認証の設定は完了しています。」／en "Two-factor authentication settings are complete."・未登録で ja「2段階認証の設定が未完了です。このユーザでログインし、設定を完了させてください。」／en "Two-factor authentication settings are incomplete. Please log in as this user to complete the settings." | `{{ 'admin.setting.system.member.two_factor_auth_enabled'\|trans }}`…`{% if Member.two_factor_auth_enabled %}`…`title="{{ Member.two_factor_auth_key ? '…two_factor_auth_completed'\|trans : '…two_factor_auth_incompleted'\|trans }}"` | member.twig:157,188-193／ja:3210-3212／en:2841-2843／md:228-230 | 1 |
| L1-M0102-032 | display_field | メンバー編集: 2段階認証行ラベル ja「2段階認証」／en "Two-factor auth"＋行ツールチップ ja「有効にすると2段階認証でのログインが必要になります。2段階認証のデバイス設定をしていない状態でログインした場合、設定後にログインできるようになります。」／en "If enabled, you must log in using two-factor authentication. You will be able to login after setting up two-factor authentication."・トグル `two_factor_auth_enabled`（ToggleSwitchType） | `data-bs-toggle="tooltip" … title="{{ 'tooltip.setting.system.member.two_factor_auth_enabled'\|trans }}"`…`{{ form_widget(form.two_factor_auth_enabled) }}`／`->add('two_factor_auth_enabled', ToggleSwitchType::class, [ ])` | member_edit.twig:227-234／MemberType:148-149／ja:3210,3684／en:2841,3296／md:236-237 | 1 |
| L1-M0102-033 | db_effect | メンバー編集保存で `dtb_member.two_factor_auth_enabled` を更新。本機能専用の成功・失敗メッセージなし＝メンバー管理共通の ja「保存しました」／en "Saved" に従う | `$this->addSuccess('admin.common.save_complete', 'admin');`（MemberController update）／「個別 2FA の ON/OFF は管理者レコードに保存する。」「本機能専用の成功・失敗メッセージなし。メンバー管理の共通保存メッセージに従う」 | MemberController:190,218／ja:1591／en:1636／md:254,278,286 | 1 |
| L1-M0102-034 | db_schema | `dtb_member.two_factor_auth_key`=string(255)・nullable／`two_factor_auth_enabled`=boolean・default false | `#[ORM\Column(name: 'two_factor_auth_key', type: Types::STRING, length: 255, nullable: true, …)]`…`#[ORM\Column(name: 'two_factor_auth_enabled', type: Types::BOOLEAN, nullable: false, options: ['default' => false])]` | Entity:143-147／md:343-344 | 0 |
| L1-M0102-035 | display_field | 本機能は専用モーダル・ポップアップ・トーストを使わない（auth/set/edit 3twigに `modal` 要素0件=実測） | 「本機能は二段階認証の確認に専用モーダル、ポップアップ、トーストを使わない。」／3twig全文grep `modal`=0件（実測） | md:102／auth.twig・set.twig・edit.twig全文 | 0 |
| L1-M0102-036 | display_field | 追加認証・初回設定はログインフレーム: `<title>`「ログイン - {店舗名}」／en "Login - {店舗名}"・noscript ja「JavaScript を有効にしてご利用ください」／en "Please enable JavaScript"・著作権「Copyright © 2000-{当年} EC-CUBE CO.,LTD. All Rights Reserved.」 | `<title>{{ 'admin.login'\|trans }} - {{ BaseInfo.shop_name }}</title>`…`<noscript><p>{{ 'admin.login.enable_javascript'\|trans }}</p></noscript>`／`Copyright &copy; 2000-{{ "now"\|date("Y") }} EC-CUBE CO.,LTD. All Rights Reserved.` | login_frame:16,25-27／auth.twig:11,46-49／set.twig:11,70-73／ja:1871,1899／en:1849,1877／md:163,167-172 | 1 |
| L1-M0102-037 | behavior | 追加認証成功時は成功メッセージなし（auth()成功分岐にaddSuccess/addFlash呼出なし=実測。遷移とCookie付与のみ） | 「追加認証成功 \| 成功メッセージなし。ホーム画面相当へ遷移し、認証済み Cookie を付与する」／Controller:58-63にフラッシュ設定コードなし（実測） | md:249／Controller:58-63 | 0 |
| L1-M0102-038 | csrf | フォームCSRF有効（`admin_two_factor_auth[_token]`）。トークン改変POSTはフォーム無効→L1-012（auth）/L1-013（set・edit）のエラー系へ（認証成立せずCookie付与なし） | `csrf_protection: { enabled: true }`／`{{ form_widget(form._token) }}`／`} else { $error = trans('…invalid_message__reinput'); }`（isValid false分岐） | framework.yaml:7／auth.twig:23／set.twig:47／edit.twig:50／Controller:70-72,153-155／md:287,362 | 0 |
| L1-M0102-039 | db_effect | 保存される秘密鍵の元は**GETで生成しフォームhiddenに埋めた秘密鍵候補**（POSTで送り返された `auth_key` の値がそのまま保存値） | `$auth_key = $this->twoFactorAuthService->createSecret(); $builder->get('auth_key')->setData($auth_key);`（GET）…`$auth_key = $form->get('auth_key')->getData();`…`$Member->setTwoFactorAuthKey($auth_key);`（POST） | Controller:133-134,139,143／md:285,361 | 0 |
| L1-M0102-040 | nav | 追加認証POSTでフォーム妥当だが秘密鍵未設定の管理者は初回設定画面へリダイレクト | `if ($Member->getTwoFactorAuthKey()) {…} else { return $this->redirectToRoute('admin_two_factor_auth_set'); }` | Controller:58,67-69／md:119 | 0 |
| L1-M0102-041 | cookie | Cookie値は複数管理者ID分のエントリを持つJSON（エントリ=検証ハッシュ+更新時刻）。認証済み状態は**ブラウザのCookie×管理者の秘密鍵**に依存（ブラウザ間で共有されない・排他なし） | `$configs->{$Member->getId()} = [ 'key' => $encodedString, 'date' => time(), ];`／「認証済み状態はブラウザの Cookie と管理者の秘密鍵に依存する。複数ブラウザ同時利用を排他する要件は持たない。」 | Service:93-100／md:299,474 | 0 |
| L1-M0102-042 | 非UI(ログ・**設計書由来/未立証**) | ログにパスワード・TOTP秘密鍵/6桁トークン・なりすまし対策トークン・2FA Cookie値・セッションID完全値を出してはならない（**不出力をコードで立証していない**・観測手段未契約＝実行保留） | 「- パスワード ／ - TOTP 秘密鍵および 6 桁トークン ／ - なりすまし対策トークン ／ - 二段階認証用 Cookie の値 ／ - セッション ID の完全値」 | md:439-445 | 0 |

LS=1 claim（15件）: L1-012/013/016/017/019/020/022/023/024/025/029/030/031/032/033/036。
（L1-033はメッセージ部分のみLS対象。L1-029のenは文言確定済み・実行はC-037保留に従属）

## §2 SEED三段参照設計（全て `@TBD-D5`）

期待値の正は**L1オラクルID**（SEED値を期待値の正にしない三段参照: 期待=L1→前提状態=SEED→実測=観測値）。
SEED実体は実装済み（`e2e/seed/sets/m01/SEED-M01-02-*.sql`・`e2e/seed/manifest.json`・
`e2e/config/seed.config.ts`）だが、fixture_versionは候補段階では確定しない（`@TBD-D5`）。
TOTP秘密鍵の原値はSQL・テスト環境変数で受け渡し本書へ書かない（md:74・L1-042）。
トークン算出は `e2e/helpers/totp.ts`（`currentTotp`／`generateTotp`／`mismatchTotp`＝±3ステップ除外）。

| SEED | 状態（dtb_member） | 用途 |
|---|---|---|
| SEED-M01-ADMIN | 2FA対象外の共通管理者（メンバー管理画面の操作者） | C-080〜083の操作者ログイン |
| SEED-M01-02-2FA-SECRET（id=900000906・login_id=e2e_2fa_secret） | システム2FA有効・個別2FA=ON・**既知秘密鍵設定済み** | 参照系: C-010/012/013/015/020/023/030〜036/040/060系(参照)/061/062/063/070/071/082/090。鍵を更新しない |
| SEED-M01-02-2FA-RESET（id=900000907・e2e_2fa_reset） | ON・既知秘密鍵設定済み・**使い捨て**（再設定で鍵破壊→再適用で復元） | 更新系: C-060/064/065 |
| SEED-M01-02-2FA-NOSECRET（id=900000908・e2e_2fa_nosecret） | ON・**秘密鍵NULL**・参照系のみ | C-011/016/022/051/052/053/083 |
| SEED-M01-02-2FA-NOSECRET-ONCE（id=900000909・e2e_2fa_nosecret_once） | ON・鍵NULL・**使い捨て**（初回設定成功で鍵確定→再適用でNULL復元） | C-050 |
| SEED-M01-02-2FA-OFF（id=900000910・e2e_2fa_off） | 個別2FA=**OFF** | C-014/041/080（トグル対象） |
| SEED-M01-02-2FA-LOCK（id=900000911・e2e_2fa_lock） | ON・既知秘密鍵。試行制限専用（リミッタ状態はDB外＝§9） | C-037 |

- 破壊系（C-050/060/064/065/080）は実行後にSEED再適用（`e2e/seed/lib/apply.sh`）。
- システム2FA（`ECCUBE_2FA_ENABLED`）は**環境既定=有効('1')のまま**（SUT設定変更なし。無効系はL1-009＝候補化せず§9）。
- 認証済みCookie状態はSEEDでなくテスト内の追加認証成功で作る（Cookie値は仕様非固定=L1-026）。

## §3 認証状態マトリクス（判定順序 md:142-151 × SEED対応）

| # | システム2FA | 個別2FA | 秘密鍵 | 認証済みCookie | 挙動（L1） | SEED | 候補ケース |
|---|---|---|---|---|---|---|---|
| 1 | 無効 | — | — | — | 誘導なし（L1-009） | —（env変更要） | 候補化せず（§9） |
| 2 | 有効 | ON | — | — | /auth自身はガード対象外（L1-004） | SECRET | C-020/030系で内包 |
| 3 | 有効 | ON | なし | 無効 | /setはガード対象外・初回設定へ誘導（L1-003/005） | NOSECRET | C-011/016/022 |
| 4 | 有効 | ON | あり | 無効 | /setアクセスは/authへ（L1-005/006）・保護URLは/authへ（L1-002） | SECRET | C-010/012 |
| 5 | 有効 | OFF | — | — | 誘導なし（L1-008）・ヘッダリンク非表示（L1-030） | OFF | C-014/041 |
| 6 | 有効 | ON | あり | **有効** | 誘導なし・/auth直アクセスはホームへ（L1-007）・/edit到達可（L1-010否定側） | SECRET＋認証成功 | C-013/023/031/040 |
| 7 | 有効 | ON | あり | 無効 | /editはホームへ→ガードで/authへ（L1-010→L1-002） | SECRET | C-015 |

入力項目（md:280-287・L1-018/021/038）:

| 項目 | 必須 | 制約 | 画面 | 保存 |
|---|---|---|---|---|
| device_token | 必須 | NotBlank＋Length(6,6)＋maxlength=6（HTML5層requiredで空送信は送信前ブロック→サーバ層は§6.1直POSTで観測） | 3画面共通 | 永続化しない（照合のみ） |
| auth_key（hidden） | set/edit POSTで必須（NotBlank） | GET生成値の送り返し | set/edit | 検証成功時に two_factor_auth_key へ保存（L1-015/039） |
| _token（CSRF） | 必須 | フォーム標準（L1-038） | 3画面共通 | — |
| two_factor_auth_enabled | フォーム定義に従う（ToggleSwitch） | — | メンバー編集（L1-032） | dtb_member.two_factor_auth_enabled（L1-033） |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全56行を実体掲載**）

- 期待値の正は `[L1:...]`（§1）。fixtureは `@TBD-D5`。URLの `/%eccube_admin_route%/` は環境値。
  `/auth`=`/%eccube_admin_route%/two_factor_auth/auth`・`/set`=`…/two_factor_auth/set`・
  `/edit`=`/%eccube_admin_route%/setting/system/two_factor_auth/edit`。
- request契約は§6.1（`admin_two_factor_auth[device_token]`・`…[auth_key]`・`…[_token]`・urlencoded・同一context）。
- **既知500バグ（§9 BC-DRAFT-M01-02-001）の影響行には〔既知500〕を付す**（期待値は仕様側のまま）。

### §4.1 bound対応候補行（49行=ja38＋-EN11。§8の81対応表が参照する全行）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m01-02_admin_login_two_factor_auth	E2E-M0102C-001	IT-13	権限	P1	未ログインで追加認証URLへ直接アクセス→管理ログイン画面へ	未ログイン	—	1. GET /auth	admin_login のログイン画面へリダイレクトされ追加認証画面は表示されない [L1:L1-M0102-001]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-002	IT-13	権限	P1	未ログインで初回設定・本人再設定URLへ直接アクセス→管理ログイン画面へ	未ログイン	—	1. GET /set 2. GET /edit	いずれも admin_login のログイン画面へリダイレクトされる [L1:L1-M0102-001]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-010	IT-03	画面遷移	P1	個別2FA ON・秘密鍵あり・未認証で保護URLへ→追加認証画面へ302誘導	SEED-M01-02-2FA-SECRETでID/PW認証済／認証済みCookie無効	保護された管理URL（ホーム等）	1. ID/PW認証後、保護URLへアクセス 2. 遷移先URLを読む	/auth へ302リダイレクトされる [L1:L1-M0102-002; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-011	IT-03	画面遷移	P1	個別2FA ON・秘密鍵なし・未認証で保護URLへ→初回設定画面へ302誘導	SEED-M01-02-2FA-NOSECRETでID/PW認証済	保護された管理URL	1. ID/PW認証後、保護URLへアクセス 2. 遷移先URLを読む	/set へ302リダイレクトされる（誘導先画面の表示は〔既知500〕=§9） [L1:L1-M0102-003; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-012	IT-13	URL直接アクセス	P1	秘密鍵設定済み管理者が/setへ→追加認証画面へリダイレクト（専用メッセージなし）	SEED-M01-02-2FA-SECRET／未認証	—	1. 未認証のまま GET /set 2. 遷移先URLと専用メッセージ非表示を確認	/set を表示せず /auth へリダイレクト・専用メッセージなし [L1:L1-M0102-006,L1-M0102-005; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-013	IT-13	URL直接アクセス	P2	認証済みCookie有効で/authへ直接アクセス→ホーム画面相当へ	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	—	1. 認証済みのまま GET /auth 2. 遷移先URLを読む	追加認証画面を表示せず admin_homepage 相当へリダイレクト・専用メッセージなし [L1:L1-M0102-007; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-014	IT-03	画面遷移	P1	個別2FA OFFの管理者は追加認証へ誘導されず保護画面を利用できる	SEED-M01-02-2FA-OFFでID/PW認証済	—	1. ID/PW認証後、保護URLへアクセス 2. 表示画面を読む	/auth・/set へ誘導されず保護画面が表示される [L1:L1-M0102-008; fixture:SEED-M01-02-2FA-OFF@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-015	IT-03	画面遷移	P2	本人再設定で認証済みCookie無効→ホームへ送られガードで追加認証へ再誘導	SEED-M01-02-2FA-SECRET／ID/PW認証済・認証済みCookie無効	—	1. Cookie無効のまま GET /edit 2. 遷移列（/edit→home→/auth）を読む	/edit を表示せずホーム画面相当へ→ガードで /auth へ誘導・専用メッセージなし [L1:L1-M0102-010,L1-M0102-002; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-016	IT-03	画面遷移	P2	秘密鍵未設定は登録完了まで保護画面を利用できない（複数保護URLで誘導継続）	SEED-M01-02-2FA-NOSECRETでID/PW認証済	保護された管理URL2種以上	1. 保護URL Aへアクセス→遷移先確認 2. 保護URL Bへアクセス→遷移先確認	いずれも /set へ誘導され保護画面本体は表示されない（誘導先表示は〔既知500〕） [L1:L1-M0102-003,L1-M0102-005; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-020	IT-25	UI部品	P2	追加認証画面の表示要素（見出し・プレースホルダ・認証ボタン・auth_keyなし）（ja）	SEED-M01-02-2FA-SECRET／未認証（ガードで/auth表示）	—	1. /auth を表示 2. h5・#admin_two_factor_auth_device_token のplaceholder・送信ボタン文言・#admin_two_factor_auth_auth_key の不存在を読む	h5「2段階認証」・placeholder「トークン」・ボタン「認証」・auth_key hidden無し [L1:L1-M0102-022,L1-M0102-021; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-020-EN	IT-25	UI部品	P3	追加認証画面の表示要素（en）	同上／locale=en	—	同上	"Two-factor auth"・placeholder "Token"・ボタン "Authentication" [L1:L1-M0102-022]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-022	IT-25	UI部品	P2	初回設定画面の表示要素（QR説明文・#qrcode・otpauth URI・トークン欄・登録ボタン・hidden auth_key）（ja）〔既知500〕	SEED-M01-02-2FA-NOSECRET／未認証（ガードで/set表示）	—	1. /set を表示 2. QR説明文・#qrcode・script内otpauth URIのsecret=とhidden #admin_two_factor_auth_auth_key の値一致・トークン欄・ボタン文言を読む	「QRコードを2段階認証用スマートフォンアプリで読み込み、表示された6桁の数字を入力してください。」・#qrcode存在・otpauth secret=hidden値・ボタン「登録」 [L1:L1-M0102-023,L1-M0102-021,L1-M0102-039; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-022-EN	IT-25	UI部品	P3	初回設定画面の表示要素（en）〔既知500〕	同上／locale=en	—	同上	"Please read the QR code with the two-factor authentication app."・ボタン "Register" [L1:L1-M0102-023]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-023	IT-25	UI部品	P3	本人再設定画面の表示要素（カード見出し・QRラベル・トークンラベル+必須バッジ・ツールチップ・登録ボタン）（ja）〔既知500〕	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	—	1. GET /edit 2. カード見出し・「QRコード」ラベル・「トークン」ラベル横の必須バッジ・tooltip title・ボタン文言・6桁トークン入力欄(text)を読む	カード見出し「2段階認証」・「QRコード」・「トークン」＋「必須」バッジ・tooltip=QR説明文・ボタン「登録」・トークン欄text型 [L1:L1-M0102-025,L1-M0102-021; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-023-EN	IT-25	UI部品	P3	本人再設定画面の表示要素（en）〔既知500〕	同上／locale=en	—	同上	"Two-factor auth"・"QR code"・"Token"＋"Required"・ボタン "Register" [L1:L1-M0102-025]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-030	IT-03	画面遷移	P1	正しい6桁トークンで追加認証成功→ホーム遷移＋Cookie付与＋成功メッセージなし	SEED-M01-02-2FA-SECRET／未認証	totp.ts currentTotp(既知秘密鍵)の6桁	1. /auth でトークン入力し「認証」押下 2. 遷移先URL・新規Cookieの有無・成功メッセージ非表示を読む	admin_homepage 相当へ遷移・新規の認証済みCookieが付与・成功メッセージは表示されない [L1:L1-M0102-011,L1-M0102-026,L1-M0102-037; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-031	IT-15	状態変化	P1	追加認証成功後は有効期間内の再アクセスで追加認証を要求されない	SEED-M01-02-2FA-SECRET／追加認証成功直後	—	1. 同一ブラウザで保護URLへ再アクセス 2. 誘導が発生しないことを読む	/auth へ誘導されず保護画面を利用できる [L1:L1-M0102-027,L1-M0102-007; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-032	IT-22	必須	P1	追加認証トークン空: HTML5層で送信ブロック／サーバ層（直POST）でreinput＋NotBlank（ja）	SEED-M01-02-2FA-SECRET／未認証	トークン=空（サーバ層は admin_two_factor_auth[device_token]="" を§6.1契約で直接POST）	1. HTML5層: 空のまま認証押下し #admin_two_factor_auth_device_token のvalidity.valueMissingを読む 2. サーバ層: 直接POSTし応答HTMLを読む	HTML5層 valueMissing=true・サーバ層は「トークンに誤りがあります。再度入力してください。」＋トークン欄直下に「入力されていません。」・/authに滞留 [L1:L1-M0102-012,L1-M0102-018,L1-M0102-019; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-032-EN	IT-22	必須	P3	追加認証トークン空のサーバ検証（en）	同上／locale=en	同上（サーバ層のみ）	1. §6.1契約で直接POST 2. 応答を読む	"There is an error in the token. Please try again."＋"No value found." [L1:L1-M0102-012,L1-M0102-019]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-033	IT-22	形式	P1	追加認証で6桁未満（5桁）→reinput表示＋exact長フィールドエラー・滞留	SEED-M01-02-2FA-SECRET／未認証	トークン=12345	1. /auth で5桁入力し認証押下 2. .text-danger と form_errors の文言・URLを読む	「トークンに誤りがあります。再度入力してください。」＋トークン欄直下「この値は6文字ちょうどで入力してください。」・/authに滞留 [L1:L1-M0102-012,L1-M0102-018,L1-M0102-020; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]（M01-02-MSG-001のen文言はL1-012/013で確定=「要ソース確認」解消）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-033-EN	IT-22	形式	P3	追加認証6桁未満（en）	同上／locale=en	同上	同上	"There is an error in the token. Please try again."＋"This value should have exactly 6 characters." [L1:L1-M0102-012,L1-M0102-020]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-034	IT-22	DB相関	P1	追加認証でTOTP不一致（形式は正しい6桁）→reinput・Cookie付与なし・DB不変	SEED-M01-02-2FA-SECRET／未認証	totp.ts mismatchTotp(既知秘密鍵)の6桁	1. /auth で不一致6桁を入力し認証押下 2. 文言・URL・新規Cookie無しを読む 3. db.tsで dtb_member(id=900000906) の行数・two_factor_auth_key 不変を照会	「トークンに誤りがあります。再度入力してください。」・/auth滞留・認証済みCookie付与なし・dtb_member不変（行追加なし） [L1:L1-M0102-012,L1-M0102-028; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-036	IT-22	境界	P2	時刻許容ウィンドウ: 1ステップ前（30秒前）のトークンでも認証成功（±2周期の内側）	SEED-M01-02-2FA-SECRET／未認証	totp.ts generateTotp(既知秘密鍵, now-30秒)	1. /auth で30秒前時刻のトークンを入力し認証押下 2. 遷移を読む	認証成功しホーム画面相当へ遷移（verifyCodeの許容ウィンドウ2=±2周期の実装確認値による） [L1:L1-M0102-028,L1-M0102-011; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-037	IT-22	試行制限	P2	追加認証POSTがユーザー単位5回/30分を超過→429＋制限メッセージ（本番向け設定・実行保留）	SEED-M01-02-2FA-LOCK／未認証／prod相当のrate limiter設定＋リミッタ状態初期化（§9）	mismatchTotpによる誤6桁で5回失敗後、6回目を送信	1. 誤トークンで5回POST 2. 6回目のPOSTの応答を読む	HTTP429（TooManyRequestsHttpException）＋「試行回数の上限を超過しました。しばらくお待ちいただき、再度お試しください。」（初回設定・本人再設定POSTは対象外） [L1:L1-M0102-029; fixture:SEED-M01-02-2FA-LOCK@TBD-D5]（実行保留=環境依存・§9）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-040	IT-25	操作起点	P2	個別2FA ONの管理者はヘッダユーザーメニューに「2段階認証 設定」リンクが表示され/editへ到達できる（ja）	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	—	1. ヘッダのユーザーメニューを開く 2. リンク文言とhrefを読む 3. リンク押下で/editへの遷移を読む	「2段階認証 設定」リンクが表示され href が /edit を指し到達できる（画面本体表示は〔既知500〕） [L1:L1-M0102-030; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-040-EN	IT-25	操作起点	P3	ヘッダリンク（en）	同上／locale=en	—	1. ユーザーメニューを開きリンク文言を読む	"Two-Factor Auth" が表示される [L1:L1-M0102-030]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-041	IT-25	操作起点	P2	個別2FA OFFの管理者はヘッダに「2段階認証 設定」リンクが表示されない	SEED-M01-02-2FA-OFFでログイン済	—	1. ヘッダのユーザーメニューを開く 2. リンク不存在を読む	「2段階認証 設定」リンクが表示されない（ONのときのみ表示の否定側） [L1:L1-M0102-030; fixture:SEED-M01-02-2FA-OFF@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-050	IT-26	登録内容	P1	初回設定成功: hidden秘密鍵候補由来のトークン一致で鍵保存＋成功メッセージ＋ホーム遷移＋Cookie付与（ja）〔既知500〕	SEED-M01-02-2FA-NOSECRET-ONCE（使い捨て）／未認証	hidden #admin_two_factor_auth_auth_key の値からtotp.tsで算出した6桁	1. /set を表示しhidden値を読む 2. トークンを算出し入力・登録押下 3. フラッシュ・遷移・新規Cookieを読む 4. db.tsで two_factor_auth_key=hidden値 を照会（実行後SEED再適用）	「2段階認証の設定が完了しました。」＋ホーム画面相当へ遷移＋認証済みCookie付与＋dtb_member.two_factor_auth_key=hiddenの秘密鍵候補値と完全一致 [L1:L1-M0102-015,L1-M0102-016,L1-M0102-039,L1-M0102-011; fixture:SEED-M01-02-2FA-NOSECRET-ONCE@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-050-EN	IT-26	登録内容	P3	初回設定成功フラッシュ（en）〔既知500〕	同上／locale=en	同上	同上	"Two-factor authentication setting is complete." 表示＋ホーム遷移 [L1:L1-M0102-016]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-051	IT-22	形式	P1	初回設定で5桁/7桁（直POST）→形式不正メッセージ・鍵は保存されずNULL維持・行追加なし（ja）〔既知500〕	SEED-M01-02-2FA-NOSECRET／未認証	§6.1契約: auth_key=GET取得値・device_token=12345（5桁）／1234567（7桁。maxlength=6のためUI入力不可＝直POST）	1. GETでhidden auth_keyと_tokenを取得 2. 5桁で直接POSTし応答を読む 3. 7桁でも同様 4. db.tsで two_factor_auth_key IS NULL と行数不変を照会	「トークンに誤りがあります。数字6桁で入力してください。」＋鍵未保存（NULL維持）・dtb_member行数不変 [L1:L1-M0102-013,L1-M0102-018,L1-M0102-020; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-051-EN	IT-22	形式	P3	初回設定の形式不正（en）〔既知500〕	同上／locale=en	同上（5桁のみ）	同上	"There is an error in the token. Please enter in 6 digits." [L1:L1-M0102-013]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-052	IT-22	必須	P2	初回設定でトークン空（直POST）→形式不正メッセージ＋NotBlank・保存されず〔既知500〕	SEED-M01-02-2FA-NOSECRET／未認証	§6.1契約: device_token=""・auth_key=GET取得値	1. 直接POST 2. 応答HTMLを読む 3. db.tsでNULL維持を照会	「トークンに誤りがあります。数字6桁で入力してください。」＋トークン欄直下「入力されていません。」・鍵未保存 [L1:L1-M0102-013,L1-M0102-019; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-053	IT-22	相関	P1	初回設定でhidden秘密鍵候補と不一致の6桁→reinput・保存されず〔既知500〕	SEED-M01-02-2FA-NOSECRET／未認証	hidden auth_key値に対する totp.ts mismatchTotp の6桁	1. /set でhidden値を読む 2. 不一致6桁を入力し登録押下 3. 文言を読む 4. db.tsでNULL維持を照会	「トークンに誤りがあります。再度入力してください。」・/setに留まり鍵未保存 [L1:L1-M0102-014; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-060	IT-26	更新内容	P1	本人再設定成功: 新hidden候補由来トークン一致で鍵が新値へ更新＋成功メッセージ＋ホーム遷移〔既知500〕	SEED-M01-02-2FA-RESET（使い捨て）／追加認証成功直後（Cookie有効）	新hidden auth_key値から算出した6桁	1. db.tsで更新前 two_factor_auth_key を記録 2. /edit でhidden新候補を読みトークン算出・登録押下 3. フラッシュ・遷移を読む 4. db.tsで key=新hidden値（旧値と不一致）を照会（実行後SEED再適用）	「2段階認証の設定が完了しました。」＋ホーム遷移＋two_factor_auth_key が新hidden値へ変更（旧値≠新値） [L1:L1-M0102-015,L1-M0102-016,L1-M0102-039; fixture:SEED-M01-02-2FA-RESET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-061	IT-25	表示	P2	本人再設定GET: 秘密鍵設定済みのとき再設定警告が表示される（ja）〔既知500〕	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	—	1. GET /edit 2. 画面上部アラート（警告）を読む	「既に2段階認証の設定が行われています。再設定すると登録済みのデバイスが使用出来なくなります。」が表示される（本人の再設定画面のみ） [L1:L1-M0102-017; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-061-EN	IT-25	表示	P3	再設定警告（en）〔既知500〕	同上／locale=en	—	同上	"Two-factor authentication has already been set. If you reset it, you will not be able to use the registered device." [L1:L1-M0102-017]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-062	IT-22	形式	P2	本人再設定で5桁/7桁（直POST）→形式不正メッセージ・鍵は変更されない〔既知500〕	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	§6.1契約: device_token=12345／1234567・auth_key=GET取得値	1. db.tsで更新前keyを記録 2. 直接POSTし応答を読む 3. db.tsでkey不変を照会	「トークンに誤りがあります。数字6桁で入力してください。」＋two_factor_auth_key が更新前の値のまま [L1:L1-M0102-013,L1-M0102-018,L1-M0102-020; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-063	IT-22	相関	P2	本人再設定でhidden候補と不一致の6桁→reinput・鍵は変更されない〔既知500〕	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	hidden新候補に対するmismatchTotpの6桁	1. db.tsで更新前keyを記録 2. /edit で不一致6桁を入力し登録押下 3. 文言を読む 4. db.tsでkey不変を照会	「トークンに誤りがあります。再度入力してください。」＋two_factor_auth_key 不変 [L1:L1-M0102-014; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-064	IT-26	更新内容	P2	本人再設定成功後、旧秘密鍵由来のトークンでは追加認証できない〔既知500〕	SEED-M01-02-2FA-RESET（使い捨て）／再設定成功直後	旧秘密鍵（SEED既知値）から算出した6桁	1. C-060の再設定を成功させる 2. 認証済みCookieを破棄し /auth を表示 3. 旧鍵由来トークンを入力し認証押下	認証に失敗し「トークンに誤りがあります。再度入力してください。」が表示される（旧鍵トークン無効化） [L1:L1-M0102-027,L1-M0102-012; fixture:SEED-M01-02-2FA-RESET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-065	IT-15	対象データ	P2	本人再設定成功後、旧秘密鍵に基づく認証済みCookieは無効として扱われ再度追加認証が要求される〔既知500〕	SEED-M01-02-2FA-RESET（使い捨て）	—	1. 追加認証成功でCookie取得（旧鍵ベース） 2. 別contextで再設定を成功させ鍵を更新 3. 旧Cookieのcontextで保護URLへアクセス	旧Cookieはハッシュ不一致で無効＝ /auth へ誘導される（Cookie検証=管理者ID+秘密鍵由来） [L1:L1-M0102-027,L1-M0102-002; fixture:SEED-M01-02-2FA-RESET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-070	IT-15	状態変化	P2	同一管理者の複数ブラウザ: 認証済み状態はブラウザのCookieに依存し共有されない	SEED-M01-02-2FA-SECRET／BrowserContext A・B の2つ	Aのみ追加認証成功	1. context Aで追加認証成功 2. Aで保護URL→誘導なしを確認 3. context B（Cookieなし・同一管理者ログイン済）で保護URL→/authへ誘導	Aは追加認証省略・Bは /auth へ誘導（排他は発生しない） [L1:L1-M0102-041,L1-M0102-002; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]（並行実行serial推奨）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-071	IT-15	対象データ	P2	追加認証成功時に付与されるCookieはHTTPOnlyで管理画面パス配下	SEED-M01-02-2FA-SECRET／未認証	有効な6桁トークン	1. 認証成功の前後で context.cookies() を比較し新規Cookieを特定 2. httpOnly属性とpathを読む	新規付与Cookieが httpOnly=true・path が管理ルート配下（**Cookie名は仕様非固定のため名称一致では判定しない**） [L1:L1-M0102-026; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-080	IT-26	更新内容	P2	別の管理者によるメンバー編集: 2段階認証行ラベル・ツールチップ表示＋トグル保存でtwo_factor_auth_enabledが更新・専用メッセージなし（ja）	SEED-M01-ADMINでログイン済／編集対象=SEED-M01-02-2FA-OFF(id=900000910)	2段階認証トグル=ON	1. メンバー編集画面（対象id=900000910）を開く 2. 「2段階認証」行ラベルとtooltip titleを読む 3. トグルONで保存 4. フラッシュを読む 5. db.tsで two_factor_auth_enabled=true を照会（実行後SEED再適用）	行ラベル「2段階認証」＋tooltip「有効にすると2段階認証でのログインが必要になります。…」表示・保存後は共通「保存しました」のみ（本機能専用メッセージなし）・DB列がtrueへ更新 [L1:L1-M0102-032,L1-M0102-033; fixture:SEED-M01-ADMIN@TBD-D5,SEED-M01-02-2FA-OFF@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-080-EN	IT-26	更新内容	P3	メンバー編集の2FA行（en）	同上／locale=en	—	1. メンバー編集画面でラベルとtooltipを読む	"Two-factor auth"＋"If enabled, you must log in using two-factor authentication. You will be able to login after setting up two-factor authentication."・保存時 "Saved" [L1:L1-M0102-032,L1-M0102-033]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-081	IT-25	表示	P2	メンバー一覧に列見出し「2段階認証」が表示される（ja）	SEED-M01-ADMINでログイン済	—	1. メンバー一覧を表示 2. 列見出し(th)文言を読む	列見出しに「2段階認証」が存在 [L1:L1-M0102-031; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-081-EN	IT-25	表示	P3	メンバー一覧の列見出し（en）	同上／locale=en	—	同上	"Two-factor auth" が存在 [L1:L1-M0102-031]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-082	IT-25	表示	P2	メンバー一覧: 個別2FA ON＋秘密鍵登録済みの行は完了ツールチップ	SEED-M01-ADMINでログイン済／SEED-M01-02-2FA-SECRET（ON＋鍵あり）	—	1. メンバー一覧で id=900000906 行の状態アイコンの title を読む	title=「2段階認証の設定は完了しています。」 [L1:L1-M0102-031; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-083	IT-25	表示	P2	メンバー一覧: 個別2FA ON＋秘密鍵未登録の行は未完了ツールチップ	SEED-M01-ADMINでログイン済／SEED-M01-02-2FA-NOSECRET（ON＋鍵なし）	—	1. メンバー一覧で id=900000908 行の状態アイコンの title を読む	title=「2段階認証の設定が未完了です。このユーザでログインし、設定を完了させてください。」 [L1:L1-M0102-031; fixture:SEED-M01-02-2FA-NOSECRET@TBD-D5]				
m01-02_admin_login_two_factor_auth	E2E-M0102C-090	IT-25	表示	P3	本機能の3画面は専用モーダル・ポップアップ・トーストを使わない	SEED-M01-02-2FA-SECRET等（各画面到達可能な状態）	—	1. /auth・/set・/edit を順に表示 2. 各画面の .modal 要素数を数える 3. 検証失敗操作後も再確認	いずれの画面・状態でも .modal が0件（失敗・成功は画面メッセージ/リダイレクト後メッセージのみ） [L1:L1-M0102-035; fixture:SEED-M01-02-2FA-SECRET@TBD-D5]（/set・/edit表示は〔既知500〕）				
```

### §4.2 補完行（7行=ja5＋-EN2。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定があるが、母集合81行の期待テキストに対応する親が存在しない〕）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m01-02_admin_login_two_factor_auth	E2E-M0102C-100	IT-25	表示	P3	追加認証画面のログインフレーム: タブタイトルと著作権表示（ja）	SEED-M01-02-2FA-SECRET／未認証	—	1. /auth を表示 2. document.title と ページ下部の著作権文言を読む	title=「ログイン - {店舗名}」（{店舗名}=店舗基本情報のショップ名）・「Copyright © 2000-{当年} EC-CUBE CO.,LTD. All Rights Reserved.」（{当年}=表示時西暦） [L1:L1-M0102-036]（補完行・親test_idなし・設計書補完。noscript文言はJS無効前提のため実行保留=§9）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-100-EN	IT-25	表示	P3	ログインフレームのタブタイトル（en）	同上／locale=en	—	1. document.title を読む	"Login - {店舗名}" [L1:L1-M0102-036]（補完行・親test_idなし・設計書補完）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-101	IT-15	CSRF	P2	追加認証POSTの_token改変はフォーム無効→reinput表示・認証成立せずCookie付与なし（非UI）	SEED-M01-02-2FA-SECRET／未認証セッション（同一context）	§6.1契約: 正規_tokenの末尾1文字を置換し、有効なcurrentTotpの6桁と共にPOST	1. GET /auth で正規_tokenを取得 2. 改変tokenで直接POST 3. 応答文言・遷移なし・新規Cookie無しを確認	リダイレクトされず「トークンに誤りがあります。再度入力してください。」を含む応答・認証済みCookie付与なし（トークンが有効でもフォーム無効で不成立） [L1:L1-M0102-038,L1-M0102-012]（補完行・親test_idなし・設計書補完）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-102	IT-25	表示	P3	本人再設定画面のタブタイトル「システム設定 2段階認証 - {店舗名}」（ja）〔既知500〕	SEED-M01-02-2FA-SECRET／追加認証成功直後（Cookie有効）	—	1. GET /edit 2. document.title とサブタイトル「システム設定」を読む	title=「システム設定 2段階認証 - {店舗名}」・サブタイトル「システム設定」 [L1:L1-M0102-024]（補完行・親test_idなし・設計書補完）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-102-EN	IT-25	表示	P3	本人再設定画面のタブタイトル（en）〔既知500〕	同上／locale=en	—	同上	"System Settings Two-factor auth - {店舗名}" [L1:L1-M0102-024]（補完行・親test_idなし・設計書補完）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-103	IT-20	出力抑止	P2	ログにパスワード・秘密鍵/トークン・なりすまし対策トークン・2FA Cookie値・セッションID完全値が出ない（非UI）	SEED-M01-02-2FA-SECRET＋RESET	—	1. 追加認証成功/失敗・初回設定・本人再設定の一連操作 2. アプリケーションログを走査	5種の秘密値がログに出現しない [L1:L1-M0102-042]（補完行・親test_idなし・設計書補完。**設計書由来・コードで不出力を立証していない**・実行保留=ログ観測手段未契約）				
m01-02_admin_login_two_factor_auth	E2E-M0102C-104	IT-15	対象データ	P3	認証済みCookieの有効期限は付与時刻+14日（既定 ECCUBE_2FA_EXPIRE=14）	SEED-M01-02-2FA-SECRET／未認証／環境の ECCUBE_2FA_EXPIRE が既定値	有効な6桁トークン	1. 認証成功前後で新規Cookieを特定 2. expires属性を読む 3. 認証成功時刻+14日（±実行猶予）との一致を確認	新規Cookieの expires ≒ 付与時刻+14×24×60×60秒（環境変数由来のため環境既定値で判定） [L1:L1-M0102-026]（補完行・親test_idなし・設計書補完）				
```

## §5 locale対応表

LS=1 claim（15件・§1末尾）→ **-EN 13行**（bound親従属11: C-020/022/023/032/033/040/050/051/061/080/081
の各-EN。補完従属2: C-100-EN・C-102-EN）。
en文言はすべてen一次資料逐語（messages.en.yaml:1636,1661,1749,1849,1875,1877,2674,2841-2843,
2852-2859,3296,3297,3402／validators.en.yaml:17／validators.en.xlf:181-184）。**ja翻訳による生成ゼロ**。
- L1-020 enの複数形分岐は `setPlural(6)`（LengthValidator:85,106）で 6≠1 → "characters" 側
  （m10-11 L1-022と同一決定根拠）。
- L1-029（試行制限）のenは文言確定済み（en:3402・oracle草案に収載）だが、-EN行はC-037自体の
  実行保留（環境依存）に従属し不作成（文言確定は100%）。
- -EN実行前提はD15（M0 Go/No-Go。文言確定は本書で完了＝実行のみ保留）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 request契約

- POST先: `POST /%eccube_admin_route%/two_factor_auth/auth`（Controller:39。GET/POST同一route）／
  `POST …/two_factor_auth/set`（Controller:81）／`POST …/setting/system/two_factor_auth/edit`（Controller:100）。
- ボディ（urlencoded・同一BrowserContextのcookie共有）: rootフォーム名=block prefix
  **`admin_two_factor_auth`**（Type:61-65）。
  - auth: `admin_two_factor_auth[device_token]`＋`admin_two_factor_auth[_token]`（auth_keyは除去済=Controller:52）。
  - set/edit: 上記＋`admin_two_factor_auth[auth_key]`（GET応答の `#admin_two_factor_auth_auth_key` の値を送り返す）。
  - 正規`_token`はGET応答の `#admin_two_factor_auth__token` から取得（auth.twig:23／set.twig:47／edit.twig:50）。
- 直接POSTが必要な系: 空トークン（HTML5 requiredがUI送信をブロック=実測・run 2026-07-06）・
  7桁（`maxlength=6` attrがUI入力を抑止=Type:45）・CSRF改変（C-101）。
- TOTP: `e2e/helpers/totp.ts`。`currentTotp(secret)`＝現在時刻の有効6桁／`generateTotp(secret, ms)`＝
  時刻指定（C-036の1ステップ前）／`mismatchTotp(secret)`＝±3ステップの全有効コードを除外した不一致6桁
  （totp.ts:37-56,59-61,68-80）。秘密鍵はシード既知値（環境変数受け渡し・本書へ原値を書かない）。
  set/editでは画面hiddenの `auth_key` を読んで算出する（SEEDの鍵ではない＝三段参照維持）。
- DB照会: `e2e/helpers/db.ts`（読取と後始末のみ）。対象は `dtb_member` の
  `two_factor_auth_key`／`two_factor_auth_enabled`／行数。
- オラクル解決: `e2e/helpers/oracle.ts` の `o(id, "m01_02_oracle")` 方式（**正式fixtureは未作成**。
  候補段階ではspec未実装のため消費なし）。
- Cookie観測: `context.cookies()` の認証成功前後差分で新規Cookieを特定（**名称一致では判定しない**=L1-026）。

### §6.2 _drafts/隔離lint証跡（実測・本候補作成時に確認）

1. oracle草案は `e2e/fixtures/oracle/_drafts/m01-02_admin_login_two_factor_auth_oracle_draft.json`
   のみに生成。**正式パス `e2e/fixtures/oracle/` 直下への書込なし**（git statusで確認可能）。
2. 正式解決器 `e2e/helpers/oracle.ts:16-25` の隔離ガード（`_drafts`・パス区切り・`..` をthrow）は
   本草案にも適用される＝正式specから本草案は解決不能（機械強制・W0で実在確認済み）。
3. 本候補は spec/page 実装・実走なし。既存 `e2e/spec/admin/two_factor_auth.spec.ts`・page・
   `e2e/seed/sets/m01/*.sql` への変更なし（参照のみ）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

- Playwright(GUI): C-001/002/010〜016/020/022/023/030/031/033/034/036/040/041/050/053/060/061/
  063/064/070/080〜083/090/100/102・各-EN行。
- Playwright+DB照会(db.ts): C-034/050/051/052/053/060/062/063/080。
- 非UI(request契約直POST): C-032（サーバ層）/051/052/062/101。非UI(Cookie属性): C-071/104。
- 破壊的（使い捨てSEED・実行後再適用）: C-050（ONCE）・C-060/064/065（RESET）・C-080（OFF）。
- 実行保留: C-037（prod limiter＋リミッタ初期化＝環境依存）・C-103（ログ観測未契約）・
  C-100のnoscript文言（JS無効前提）・-EN 13行（D15待ち）。
- 並行実行: C-070（2context）はserial推奨。使い捨てSEED系は同一workerで直列。
- 聖域判定・多軸属性の正式付与はD14後（本節は候補の参考情報であり正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（観点ラベル不使用）。1候補ケース行=1 assertion bundle・
多対一は shared-observation・-EN行は対応ja行と同一親のlocale多重。**参照先の全候補行は§4に実体掲載済み
＝81↔候補の期待テキスト突合が本文内で完結する**。

### 集計（81 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **56** | 下表 |
| **TBD** | **0** | —（全bound行は§1のL1で拘束済み。実行面の保留=要実機・環境依存は§9に別掲＝オラクル化不能ではない） |
| **excluded** | **25** | EX-A 検索取得系18（019〜036）／EX-B 行追加(INSERT)肯定7（037,039,041,042,044,046,047） |
| 合計 | **81** | 欠落0・理由なし重複0 |

- 候補ケース行総数**56**（§4.1 bound対応49〔ja38＋-EN11〕＋§4.2 補完7〔ja5＋-EN2〕）。
- excluded根拠（各カテゴリの実test_idを引いて期待テキストで確認済み）:
  - **EX-A（019〜036・18件）**: 期待は全行「検索条件／実行結果の該当レコードが取得結果に含まれる
    （含まれない）こと」。本機能に検索操作・検索フォーム・一覧クエリが存在しない:
    Controllerのrepository呼出は `save` のみ（Controller:144。findBy/createQueryBuilder等の検索系呼出なし=実測）・
    Listenerは現在ユーザー参照のみ（Listener:64）・3画面twigに検索フォーム要素0件（実測）・
    「API \| 本機能はブラウザ経由の管理画面フォームとして動作し」「バッチ \| 本機能はバッチを起動しない」（md:319-320）。
    「検索」という操作自体が存在しないため過剰生成。メンバー一覧の検索は別機能（m11系）の機能であり、
    本機能スコープの一覧表示条件（列見出し・ツールチップ）はbound 062/063/064（C-081〜083）が被覆
    （**偽陰性なし**）。
  - **EX-B（037,039,041,042,044,046,047・7件）**: 期待は全行「登録内容/実行結果の対象レコードが
    **追加されること**」（INSERT肯定側）。本機能のDB操作は `dtb_member` の**更新のみ**:
    「操作種別 \| 更新」「本機能では削除は行わない」（md:348-352）・Controllerは取得済み`$Member`への
    setter＋`save`のみでエンティティnew/新規persistなし（Controller:143-144=実測）。
    行追加経路が存在せず「レコードが追加される」期待は成立不能。**鍵保存の受理という意味成分は
    bound 070/054/056（C-050/C-060）が被覆**し、否定側038/043/045は「DB不変・行数不変」assertionへ
    **bound**（外さない・**偽陰性なし**）。

### 81対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | 認証アプリが表示する6桁のワンタイムコードとして入力される値 | bound | C-030,C-036 (shared) |
| 002 | 個別2FA ONだが鍵未設定のとき、QR等を用いて鍵を登録する画面・処理 | bound | C-011,C-022,C-050 (shared) |
| 003 | 検証/登録成功後に付与され一定期間追加認証を省略するHTTPOnly Cookie | bound | C-030,C-031,C-071 (shared) |
| 004 | 既に鍵がある状態で新しい鍵に付け替える操作 | bound | C-060,C-064 (shared) |
| 005 | 6桁入力→成功でホーム相当へ遷移し認証済みCookie付与 | bound | C-030 (shared) |
| 006 | QRコードを表示し6桁トークンで鍵を確定 | bound | C-022,C-050 (shared) |
| 007 | ヘッダー等から開く想定・Cookieがあるユーザーにのみ到達しやすい | bound | C-040,C-015 (shared) |
| 008 | 別の管理者による他メンバー編集であること | bound | C-080 |
| 009 | 必須バリでエラー表示・処理未完了 | bound | C-032(+EN),C-052 |
| 010 | 必須バリでエラー表示され**ず**継続 | bound | C-030 (shared)（必須充足の有効入力で継続=肯定側） |
| 011 | 専用モーダル・ポップアップ・トーストを使わない | bound | C-090 |
| 012 | 相関バリでエラー表示・未完了 | bound | C-053,C-063（hidden鍵候補×トークンのフォーム内相関） |
| 013 | 相関バリでエラー表示され**ず**継続 | bound | C-050 (shared)（候補一致で継続） |
| 014 | 相関バリ該当値でエラーなし継続 | bound | C-050,C-060 (shared) |
| 015 | 相関バリ非該当値でエラー・未完了 | bound | C-053,C-063 (shared) |
| 016 | DB相関バリ該当値でエラーなし継続 | bound | C-030 (shared)（DB鍵と一致するトークン） |
| 017 | DB相関バリ非該当値でエラー・未完了 | bound | C-034 |
| 018 | （QR説明文）初回設定画面を表示したときであること | bound | C-022 (shared) |
| 019〜036 | 検索条件/実行結果の該当レコードが取得結果に含まれる（含まれない） | **excluded** EX-A | — |
| 037 | 対象レコードが**追加される**こと | **excluded** EX-B | — |
| 038 | 対象レコードが追加され**ない**こと | bound | C-034,C-051 (shared)（dtb_member行数不変・鍵未保存） |
| 039 | 追加されること | excluded EX-B | — |
| 040 | TOTP検証はサーバ時刻とライブラリ許容範囲に依存 | bound | C-036 |
| 041 | 追加されること | excluded EX-B | — |
| 042 | （最大長）追加されること | excluded EX-B（受理成分は054/056=C-060が被覆） | — |
| 043 | （最大長+1）追加され**ない**こと | bound | C-051（7桁直POST拒否・NULL維持・行数不変） |
| 044 | （最小長）追加されること | excluded EX-B（受理成分は同上） | — |
| 045 | （最小長-1）追加され**ない**こと | bound | C-051（5桁拒否・NULL維持） (shared) |
| 046 | （初回設定画面）追加されること | excluded EX-B | — |
| 047 | （本人の再設定画面）実行結果の対象レコードが追加されること | excluded EX-B | — |
| 048 | 別の管理者による他メンバー編集であること | bound | C-080 (shared) |
| 049 | 更新内容の対象レコードの値が変更されること | bound | C-060 |
| 050 | 値が変更され**ない**こと | bound | C-062,C-063 |
| 051 | 値が変更されること | bound | C-060 (shared) |
| 052 | 追加認証・初回設定・本人再設定は6桁トークン(text)と送信ボタン | bound | C-020(+EN),C-022(+EN),C-023(+EN) (shared) |
| 053 | 値が変更されること | bound | C-060 (shared) |
| 054 | （最大長=6桁）値が変更されること | bound | C-060 (shared)（min=max=6の有効長） |
| 055 | （最大長+1=7桁）値が変更され**ない**こと | bound | C-062 (shared) |
| 056 | （最小長=6桁）値が変更されること | bound | C-060 (shared) |
| 057 | （最小長-1=5桁）値が変更され**ない**こと | bound | C-062 (shared) |
| 058 | 値が変更されること | bound | C-060 (shared) |
| 059 | 実行結果の対象レコードの値が変更されること | bound | C-060 (shared) |
| 060 | GETで秘密鍵が既にDBにあるとき（本人の再設定画面のみ） | bound | C-061(+EN) |
| 061 | ログイン中管理者の個別2FAがONのときのみ表示 | bound | C-040(+EN)（肯定側）,C-041（否定側） |
| 062 | メンバー一覧を表示したときであること | bound | C-081(+EN) |
| 063 | 当該メンバーの個別2FAがONかつ鍵登録済みのとき | bound | C-082 |
| 064 | 当該メンバーの個別2FAがONかつ鍵未登録のとき | bound | C-083 |
| 065 | 追加認証POSTがユーザー単位5回/30分の上限を超えたとき（本番向け設定） | bound(実行保留) | C-037 |
| 066 | （追加認証成功）成功メッセージなし | bound | C-030 (shared)（不在assertion） |
| 067 | （メンバー管理保存）本機能専用の成功・失敗メッセージなし | bound | C-080 (shared)（共通「保存しました」のみ） |
| 068 | 要ソース確認であること（M01-02-MSG-001） | bound | C-033(+EN),C-051(+EN)（実ソースでja/en文言確定=ja:3227-3228/en:2858-2859。「要ソース確認」を解消） |
| 069 | （M01-02-MSG-003）ホーム画面に遷移すること | bound | C-050,C-060 (shared) |
| 070 | 鍵未設定で候補と6桁一致時に鍵をDB保存しCookie付与 | bound | C-050 |
| 071 | 認証済みCookieが有効な利用者だけが鍵を付け替える | bound | C-060（肯定側）,C-015（否定側=Cookie無効はホームへ） |
| 072 | 成功後Cookie付与・有効期間内は追加認証省略 | bound | C-030,C-031 (shared) |
| 073 | 画面表示データでエラーなく継続（メンバー管理） | bound | C-081,C-080 (shared) |
| 074 | （秘密鍵候補hidden）検証成功時にtwo_factor_auth_keyへ保存する値の元 | bound | C-050（DB値=hidden値の一致）,C-022 (shared) |
| 075 | 画面表示データでエラーなく継続（個別2FAのON/OFF） | bound | C-080 (shared) |
| 076 | 初回設定へ誘導し登録完了まで保護画面を利用できない | bound | C-011,C-016 |
| 077 | 認証済み状態はブラウザのCookieと管理者の秘密鍵に依存 | bound | C-070 |
| 078 | 認証済みCookieは管理者IDと秘密鍵から検証される | bound | C-065,C-064 (shared) |
| 079 | 初回設定/再設定では鍵保存とCookie付与が成功時の副作用 | bound | C-050,C-060 (shared) |
| 080 | TOTP検証はサーバ時刻とライブラリ許容範囲に依存 | bound | C-036 (shared) |
| 081 | 認証アプリが表示する6桁のワンタイムコードとして入力される値 | bound | C-030,C-036 (shared) |

`func_scope_check` 判定: 親81/81会計済み・欠落0・理由なし重複0・補完7行（-EN従属2含む）は§4.2に
実体掲載（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

### 機械自己検査（工程6・実施記録）

1. **自己完結**: §8対応表が参照する全候補ケースID（C-001〜C-102）は§4.1/§4.2に実体掲載＝外部参照0。
2. **会計合計**: bound56＋TBD0＋excluded25=81（母集合81と一致・重複附番なし）。
3. **source_class**: 全L1根拠はee実ソース／vendor xlf／設計書md（standard-src+design の許可範囲内。
   Excel・pf由来出典0件）。
4. **C4対象列挙**: §10に極性対の全列挙と判定を記録。
5. **隔離**: §6.2のとおり `_drafts/` のみ出力・正式パス書込なし。

## §9 TBD・要実機・excluded・不具合候補（正直な分離）

- **TBD=0件**: 全bound行はL1（§1）で期待値拘束済み。excluded 25件は§8の一次資料根拠つき。
- **不具合候補（乖離検出＝期待値どおりでない既知の実挙動。期待値は仕様側のまま維持）**:
  - **BC-DRAFT-m01-02-001**: `set()`（Controller:83 `public function set(Request $request): RedirectResponse`）
    と `edit()`（Controller:102 同型）は戻り値型を `RedirectResponse` に宣言しながら、
    `createResponse()`（Controller:120 `array|RedirectResponse`・GET/検証失敗時はarray返却=Controller:158-163）
    をそのまま返す（Controller:97,109-114）→ **GET表示・POST失敗再描画でPHP TypeError=HTTP500**。
    実測根拠: 既存E2E実行（2026-07-06・16〇14×。`integration_test/e2e/m01_02_admin_login_two_factor_auth_e2e_cases.md`
    の E2E-M01-02-003/004/005/011/012/030/031/040/041 失敗理由に実装例外を記録済み）。
    `auth()` は戻り値型 `RedirectResponse|array`（Controller:41）で正常。
    **影響行の正規リスト（単一の正・本文§4の〔既知500〕マークと完全一致。論理行17＝ja行17、
    locale派生-EN 6を加えた物理行23）**:
    C-011（誘導先の/set表示）・C-016（同）・C-022(+EN)・C-023(+EN)・C-040（リンク押下後の/edit画面本体表示）・
    C-050(+EN)・C-051(+EN)・C-052・C-053・C-060・C-061(+EN)・C-062・C-063・C-064・C-065・
    C-090（/set・/edit表示分のみ部分影響）・C-102(+EN)。
    数え方: 論理行=ja行単位で**上記列挙の17件**（リストの重複掲載はしない=この列挙が単一の正）。
    物理行=論理行17＋-EN従属6（上記列挙中(+EN)付き6件: C-022-EN・C-023-EN・C-050-EN・C-051-EN・
    C-061-EN・C-102-EN）=**23件**。
    **期待値は設計書・標準ソースの正常系のまま**（実走時は×=乖離として記録する運用）。
  - （参考・不具合候補にしない）試行制限は既定(非prod)configに `admin_two_factor_auth` limiter未定義=非活性
    （rate(既定):1-18実測）。設計書自身が「本番向けレート制限設定にて…掛かりうる」（md:422）と条件付き
    記載のため**乖離ではなく環境条件**（C-037の実行保留理由）。
- **要実機・実行保留（オラクル化不能ではない）**:
  1. **C-037（試行制限）**: prod相当limiter設定の環境＋リミッタ（cache/Redis）状態初期化ハーネス＋
     専用アカウント（SEED-M01-02-2FA-LOCK）が前提。オラクル自体は確定（429＋L1-029文言）。
  2. **C-103（ログ出力抑止）**: 設計書由来・コードで不出力を立証していない・ログ観測手段未契約。
  3. **C-100のnoscript文言**: JS無効状態が前提（Playwright既定では観測不能）。
  4. **-EN 13行**: 管理画面en切替はD15（M0 Go/No-Go）待ち。文言確定は本書で100%完了
     （L1-029のenは行なし・json収載のみ＝§5）。
  5. **セレクタ**: DOM id（`#admin_two_factor_auth_*`）はType:61-65のblock prefix由来の導出＋
     既存spec/page実績（2026-07-06実走で16件〇）。edit画面のインラインエラー（edit.twig:90-92）と
     `addError` フラッシュ（Controller:110-112）の**二重表示有無**は実機確認（旧付帯表4#2踏襲）。
  6. **Cookie属性のSecure/SameSite**: `eccube_force_ssl` 連動＝SSL環境依存（L1-026。C-071はHttpOnly/pathのみ判定）。
- **候補化せず（理由記録のみ・母集合に対応期待テキストなし）**:
  - L1-009（システム2FA無効時は誘導なし）: 環境変数 `ECCUBE_2FA_ENABLED` の変更＝SUT設定変更を要する
    （CFP§1.2非目的）。母集合81行にこの挙動の期待テキストは存在しない（補完も不作成・m10-11の
    0件エッジ扱いと同型）。
  - Cookie期限切れ後の再認証（md:298）: 14日経過の時間依存（期限属性の値検証はC-104が被覆）。
- **excluded=25件**: §8集計表・根拠のとおり（EX-A 18／EX-B 7）。
- **候補規律**: 全行 `@TBD-D5`・O5未確定（暫定source_class）・spec/page実装なし・実走なし・
  聖域/多軸/O6を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文（肯定/否定・許可/拒否の対）を列挙し、claim単位で期待テキストとの極性一致を目視確認した:

| 極性対 | 該当行 | 判定 |
|---|---|---|
| エラー表示**され**/表示され**ず** | 009,012,015,017（され）vs 010,013,014,016,073,075（されず） | され→C-032/052（必須）・C-053/C-063（相関）・C-034（DB相関）＝拒否側／されず→C-030（DB相関一致）・C-050/C-060（相関一致）・C-080/C-081（表示継続）＝許可側。取り違えなし |
| 追加され**る**/され**ない** | 037,039,041,042,044,046,047（肯定）vs 038,043,045（否定） | 肯定=EX-B（INSERT経路なし=成立不能・md:352「更新」のみ）・否定=行数不変/NULL維持assertionへbound（C-034/C-051）。**肯定側をboundにする取り違えなし** |
| 変更され**る**/され**ない** | 049,051,053,054,056,058,059（肯定）vs 050,055,057（否定） | 肯定→C-060（再設定成功=鍵更新）・否定→C-062/C-063（検証失敗=鍵不変）。整合 |
| 表示する/表示し**ない** | 061（ONのみ表示）・060（鍵ありのみ警告）・066/067（メッセージ**なし**） | 061→C-040（肯定）+C-041（否定）の両側bind／060→C-061（表示条件正側）／066/067→C-030/C-080の**不在assertion**（「なし」を肯定表示と取り違えていない） |
| 利用できる/でき**ない** | 007,071（Cookie有効者のみ到達/付替え）・076（完了まで利用不可） | 007/071→C-040/C-060（許可側）+C-015（拒否側）／076→C-011/C-016（拒否側）。両側bind済み |
| 含まれる/含まれない（検索） | 019〜036 | 両極性ともEX-A（検索操作不存在）＝極性によらず除外。片極性のみ除外する誤りなし |
| 一致/不一致（TOTP） | 001,005,016,040,070,080（一致=成功側）vs 012,015,017,038（不一致=失敗側） | 成功側→C-030/C-036/C-050/C-060・失敗側→C-034/C-053/C-063。mismatchTotpは±3ステップ除外（totp.ts:68-80）で「偶然一致」を排除＝失敗側の観測が確定的 |

- 068「要ソース確認であること」は生成残渣であり、前提列のM01-02-MSG-001から主題=トークン誤り文言と
  同定し、実ソース（ja:3227-3228／en:2858-2859）で文言確定してC-033/C-051へbind
  （**憶測でなく一次資料で閉じたことを記録**。m10-11の052「要ソース確認解消」と同型）。
- 既知500バグ（BC-DRAFT-m01-02-001）に対し**期待値を実装へ寄せた行が無い**ことを全〔既知500〕行で
  確認（期待は設計書md:189-216・標準ソースの正常系のまま）。
- **codex敵対レビューR1（是正済み・Blockerなし）**: 検出=Major1「§9の既知500影響行列挙にC-040が欠落
  （本文の〔既知500〕マークとの内部不整合）」→§9を**17論理行（物理23行）の正規リスト**へ是正し
  本文マークと完全一致させた。excluded=25（検索18/INSERT肯定7）・否定側038/043/045のbound非対称・
  相関12-17のbound・Length「6文字ちょうど」・TOTP三段契約・068解消・Cookie/鍵更新の各判定は
  codexが妥当確認（維持）。C4対象の極性取り違えは検出されず（未検出の可能性は残る）。

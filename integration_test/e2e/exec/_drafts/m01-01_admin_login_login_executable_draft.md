# B0候補: m01-01 管理ログイン（認証機能） — 実行可能グレード候補（母集合59全量踏破）

> 2026-07-23 ／ **候補グレード（candidate・D6前・O5未確定・実装/実走なし）**
> codexレビュー: 未実施（本版=R0著作。台帳 `REVIEW_LEDGER.md` への記帳はレビュー後）。
> source_class=standard-src+design は fid_kubun.tsv（D1・fid_kubun.tsv:161）による**暫定付与**（確定はD6）。
> **O5合格・承認済み草案・具体化完了（正式）・O6/聖域/多軸join/C6C7通過をいずれも主張しない**。
> fixture_version は全て `@TBD-D5`。統治: `integration_test/CONCRETIZATION_FIRST_PLAN.md`（改訂2・三段会計）＋
> `integration_test/CONCRETIZATION_ROLLOUT_PLAN.md`（改訂2・B0。先頭=M01-01）。
> 正典: `integration_test/e2e/PILOT_m09_01_news_executable_grade.md`／同型見本: codex承認済み候補4本
> （m09-01・m05-16・m10-11・m03-11 の各 `_drafts/*_executable_draft.md`）。
> 出力隔離: 本md＝`_drafts/`／oracle草案＝`e2e/fixtures/oracle/_drafts/m01-01_admin_login_login_oracle_draft.json`。
> 正式パス `e2e/fixtures/oracle/` 直下には書かない。
> **改訂1（codexレビューR1「要修正・Blockerなし」の是正。excluded=0・捏造ゼロはcodex妥当確認済み）**:
> (1) **IT-049を4状態被覆へ再bind**（ログイン=C-013／ログアウト=C-061／Remember Me再確立=C-060／
> 自動ログアウト=C-062。C-061/C-062を§4.2補完から**§4.1 bound対応へ昇格**し、C-060/C-061/C-062に
> モーダル・確認ダイアログ非表示の観測を追加＝L1-033の観測範囲を4状態へ拡張）
> (2) **BC-DRAFT-m01-01-1の波及をC-061へ接続**（フラグ未削除の場合ログアウトGET自体が成功区分INSERT契機に
> なりうる＝履歴非保存判定への影響を期待セルに明記。§9-8に影響行C-021/C-041/C-061を正規列挙）
> (3) C-041の件数期待を `count >= 1` に統一（BC-DRAFT整合） (4) §8に相関/DB相関の**semantic bind**注記。
> **行数集計**: 候補ケース行総数**45**＝bound対応39（ja34＋-EN5）＋補完6（ja5＋-EN1）。
> 母集合59=bound58＋TBD1＋excluded0。

## §0 版固定

- 設計書正本: `functions/ec-cube-enterprise/m01-01_admin_login_login.md`（本repo HEAD `d1e94c5e38246d0eff45b4079ee42397c994e69d` 時点）。
- ee実ソース: `/home/y-saito/Developments/ec-cube-enterprise/` コミット `9dbc4dd12080ac6a3d58a97f67e23e4a4a6e4f51`（W0-W2と同一）。
- vendor: symfony/security-http **v7.4.3**・symfony/security-core **v7.4.3**・symfony/validator v7.4.3（composer.lock実測）。
- fid_kubun.tsv（D1）: `M01-01｜m01-01_admin_login_login｜パスワード認証｜対象｜標準｜standard-src+design｜区分不明=0`
  （fid_kubun.tsv:161。target_sha256=4a255392…・todo_sha256=5452cf67…＝ファイル冒頭ヘッダ実測。
  fid_kubun.tsv sha256先頭=44fbf02f1e4c）。
- 母集合: baseline `all_it_cases.tsv`（sha256先頭 `7911f190d273`）M01-01全**59行**（IT-M01-01-ADMIN-LOGIN-LOGIN-001〜059）。
- 既存実行実績（参考・本候補の会計外）: `integration_test/e2e/m01_01_admin_login_login_e2e_cases.md`
  （2026-07-06 Codex実走 20〇/3×。×=試行制限030/031〔RateLimiter状態生成未実装〕・092〔login_date可視UI未特定〕）。
- **判定原則（W0-W2教訓）**: 観点ラベル・前提条件/入力データ列のシナリオ語は**生成器ノイズ**。bindは各行の
  **「期待結果／レスポンス」実テキスト**で判定し、極性も期待テキストで確認する（§8に全59行の期待要旨併記）。
  本機能の母集合は前提列（例: 024「最大長」/027「最小長-1」）と期待列の噛み合わせずれが大きい。

## §1 L1原子オラクル表

規約: claimは検査可能な期待実値まで分解。quoteは一次資料の逐語。LS=locale_sensitive（0は理由コード）。
**期待値の正は本表のオラクルIDでありSEED値ではない（三段参照）**。`%eccube_admin_route%` は環境値（既定 `admin`・env `ECCUBE_ADMIN_ROUTE`＝eccube.yaml:69。以下URLは全てこのプレースホルダ表記）。

| oracle_id | 観点 | claim（検査可能な期待） | source_class(暫定) | 逐語quote | 根拠(file:line) | LS |
|---|---|---|---|---|---|---|
| L1-M0101-001 | auth_rule | 未ログインで保護管理URL（`^/%eccube_admin_route%/`＝ROLE_ADMIN必須。`/login` のみ匿名可）へアクセスすると、admin firewallのform_loginエントリポイントにより**ログイン画面（route `admin_login`）へリダイレクト**され業務画面は表示されない | standard-src＋設計書md | `['path' => '^/%eccube_admin_route%/login', 'roles' => 'IS_AUTHENTICATED_ANONYMOUSLY'], ['path' => '^/%eccube_admin_route%/', 'roles' => 'ROLE_ADMIN'],`／`form_login:`…`login_path: admin_login`／「未ログインで保護された管理画面へアクセス｜ログイン画面」 | EccubeExtension.php:81-88／security.yaml:40-46／m01-01md:93,330,344 | 0 `non-translated` |
| L1-M0101-002 | http_status | ログイン入口=`GET/POST /%eccube_admin_route%/login`（route `admin_login`・GET=画面表示/POST=認証送信。POSTはSymfony Security `form_login` が受ける: `check_path: admin_login`） | standard-src＋設計書md | `#[Route(path: '/%eccube_admin_route%/login', name: 'admin_login', methods: ['GET', 'POST'])]`／`check_path: admin_login`／「管理ログイン画面｜`GET /%eccube_admin_route%/login`」「ログイン送信｜`POST /%eccube_admin_route%/login`」 | AdminController.php:67-69／security.yaml:43-46／m01-01md:91-92 | 0 `non-ui-observable` |
| L1-M0101-003 | http_status | ログアウト=`GET /%eccube_admin_route%/logout`（route `admin_logout`）。logoutハンドラの戻り先=`admin_login` | standard-src＋設計書md | `admin_logout:`＋`    path: '/%eccube_admin_route%/logout'`／`logout:`…`path: admin_logout`…`target: admin_login`／「ログアウト｜`GET /%eccube_admin_route%/logout`｜管理セッションを終了し、ログイン画面へ戻す。」 | routes.yaml:80-81／security.yaml:64-66／m01-01md:94 | 0 `non-ui-observable` |
| L1-M0101-004 | display_field | ログイン画面の表示要素: `form#form1`（method=post・action=admin_login）内に hidden `input[name="_csrf_token"]`（値=`csrf_token('authenticate')`）・ログインID欄 `#login_id`（text・placeholder=`admin.login.login_id` ja「ログインID」/en "ID"）・パスワード欄（password・placeholder=`admin.login.password` ja「パスワード」/en "Password"・twigにid明示なし＝render由来 `#password` は実機確認済み）・送信ボタン（`admin.login.login` ja「ログイン」/en "Sign in"）・失敗時のみエラー領域 `.text-danger` | standard-src＋設計書md | `<form name="form1" id="form1" method="post" action="{{ path('admin_login') }}">`／`<input type="hidden" name="_csrf_token" value="{{ csrf_token('authenticate') }}">`／`form_widget(form.login_id, {'id': 'login_id', 'attr': {'placeholder': 'admin.login.login_id', …}})`／`form_widget(form.password, {'attr': {'placeholder': 'admin.login.password'}})`／`{% if error %}…<span class="text-danger">`／`<button type="submit" …>{{ 'admin.login.login'|trans }}</button>`／`admin.login.login: ログイン`・`admin.login.login_id: ログインID`・`admin.login.password: パスワード`／`admin.login.login: Sign in`・`admin.login.login_id: ID`・`admin.login.password: Password`／「管理ログイン画面にはログイン ID、パスワード、なりすまし対策トークン、送信ボタン、認証エラーまたは制限状態のメッセージを表示する」 | login.twig:22-37／messages.ja.yaml:1900-1902／messages.en.yaml:1878-1880／m01-01md:103,177-179 | 1 |
| L1-M0101-005 | display_field | ブラウザタブ `<title>`＝`{admin.login} - {BaseInfo.shop_name}`: ja「ログイン - {店舗名}」／en "Login - {店舗名}"（{店舗名}=店舗基本情報のショップ名・実行時値） | standard-src＋設計書md | `<title>{{ 'admin.login'|trans }} - {{ BaseInfo.shop_name }}</title>`／`admin.login: ログイン`／`admin.login: Login`／「ブラウザのタブ（`<title>`）｜`ログイン - {店舗名}`｜未ログインでログイン画面を表示したとき」 | login_frame.twig:16／messages.ja.yaml:1871／messages.en.yaml:1849／m01-01md:173 | 1 |
| L1-M0101-006 | display_field | ページ下部の著作権表記＝`Copyright © 2000-{当年} EC-CUBE CO.,LTD. All Rights Reserved.`（{当年}=表示時の西暦・twigリテラル） | standard-src＋設計書md | `<small>Copyright &copy; 2000-{{ "now"|date("Y") }} EC-CUBE CO.,LTD. All Rights Reserved.</small>`／「ページ下部（著作権）｜`Copyright © 2000-{当年} EC-CUBE CO.,LTD. All Rights Reserved.`」 | login.twig:45／m01-01md:184 | 0 `non-translated`（twigリテラル・ロケール非依存） |
| L1-M0101-007 | display_field | `noscript`（JS無効時のみ）＝`admin.login.enable_javascript` ja「JavaScript を有効にしてご利用ください」／en "Please enable JavaScript" | standard-src＋設計書md | `<noscript><p>{{ 'admin.login.enable_javascript'|trans }}</p></noscript>`／`admin.login.enable_javascript: JavaScript を有効にしてご利用ください`／`admin.login.enable_javascript: Please enable JavaScript`／「ページ上部（`noscript`）｜…｜JavaScript が無効のときのみ」 | login_frame.twig:25-27／messages.ja.yaml:1899／messages.en.yaml:1877／m01-01md:174 | 1 |
| L1-M0101-008 | status_transition | ログイン済み（ROLE_ADMIN）で `admin_login` をGET→ログイン画面を表示せず `admin_homepage`（`/%eccube_admin_route%/`）へリダイレクト。専用メッセージなし | standard-src＋設計書md | `if ($this->authorizationChecker->isGranted('ROLE_ADMIN')) { return $this->redirectToRoute('admin_homepage'); }`／「ログイン済みでログイン URL を開く｜なし。ホーム画面へリダイレクトする」 | AdminController.php:71-73／m01-01md:116,203,240 | 0 `non-translated` |
| L1-M0101-009 | message | 認証失敗の表示は `.text-danger` に**2行**（`error.messageKey|trans(error.messageData, 'validators')|nl2br`）。`Invalid credentials.` の解決値: ja「ログインできませんでした。\n入力内容に誤りがないかご確認ください。」／en "Failed to sign in.\nPlease make sure if the credentials are correct."。失敗理由（未入力・不存在ID・停止中・不一致）によらず同一 | standard-src＋設計書md | `return 'Invalid credentials.';`／`Invalid credentials.: |`＋`  ログインできませんでした。`＋`  入力内容に誤りがないかご確認ください。`／`Invalid credentials.: |`＋`  Failed to sign in.`＋`  Please make sure if the credentials are correct.`／`<span class="text-danger">{{ error.messageKey|trans(error.messageData, 'validators')|nl2br }}</span>`／「上記2行は、ログイン ID 未入力・パスワード未入力・存在しない ID・停止中・ログイン不可・パスワード不一致・CSRF 不整合のいずれでも同じである」 | BadCredentialsException.php:22-25／validators.ja.yaml:19-21／validators.en.yaml:19-21／login.twig:31-35／m01-01md:186-193 | 1 |
| L1-M0101-010 | message | CSRFトークン不整合（`_csrf_token` 改変）も認証不成立・表示は同一2行（`Invalid CSRF token.` の解決値がja/enとも `Invalid credentials.` と同文言） | standard-src＋設計書md | `return 'Invalid CSRF token.';`／`Invalid CSRF token.: |`＋`  ログインできませんでした。`＋`  入力内容に誤りがないかご確認ください。`（ja）／`Invalid CSRF token.: |`＋`  Failed to sign in.`＋`  Please make sure if the credentials are correct.`（en）／「フォーム直下（赤文字・CSRF 不整合）｜…（文言は認証失敗と同一）」 | InvalidCsrfTokenException.php:22-25／validators.ja.yaml:22-24／validators.en.yaml:22-24／m01-01md:181,193／security.yaml:44（`enable_csrf: true`） | 1 |
| L1-M0101-011 | auth_rule | 未入力はサーバ層で**認証失敗**として扱う（form_loginが受け、空username/passwordは `BadCredentialsException` → 2行表示。Symfony Formの `NotBlank` フィールドエラー「入力されていません。」は出ない）。UI層はNotBlank由来のrequired属性によりHTML5 `valueMissing` で送信ブロック（ブラウザ既定文言はSUT外＝期待にしない） | standard-src＋設計書md | `throw new BadCredentialsException(\sprintf('The key "%s" must be a non-empty string.', $this->options['username_parameter']));`（password側も同型）／`'constraints' => [ new Assert\NotBlank(), ],`／「ログイン送信は認証基盤の `form_login` が受けるため、Symfony Form の `NotBlank` による『入力されていません。』等のフィールド直下エラーは出さない。未入力も上記『認証失敗（2行）』として表示する」 | FormLoginAuthenticator.php:131,141／LoginType.php:43-45,52-54／m01-01md:123,145,195,235 | 0 `non-translated`（表示文言はL1-009） |
| L1-M0101-012 | validation_rule | フォーム定義: login_id/passwordとも必須（NotBlank）・`maxlength` 属性=**50**（`eccube_id_max_len`/`eccube_password_max_len`=50）。管理ログインに**文字数下限の事前チェックは無い**（最小桁チェックは顧客ログイン専用） | standard-src＋設計書md | `'attr' => [ 'maxlength' => $this->eccubeConfig['eccube_id_max_len'], ],`／`'attr' => [ 'maxlength' => $this->eccubeConfig['eccube_password_max_len'], ],`／`eccube_id_max_len: 50`／`eccube_password_max_len: 50`／「最大長はアプリ共通の ID 最大長設定（実装確認値 50 文字）に従う」「管理ログインには文字数下限の事前チェックは無い」 | LoginType.php:39-55／eccube.yaml:109,196／m01-01md:226-227,316-317 | 0 `non-translated` |
| L1-M0101-013 | auth_rule | ログインIDに一致する管理者が存在しない場合 `UserNotFoundException` → AuthenticatorManagerが `BadCredentialsException` へ隠蔽（user enumeration防止）→ 表示は同一2行 | standard-src＋設計書md | `$Member = $this->memberRepository->findOneBy(['login_id' => $identifier, 'Work' => Work::ACTIVE]); if (null === $Member) { throw new UserNotFoundException(…); }`／`if ($this->isSensitiveException($authenticationException)) { $authenticationException = new BadCredentialsException('Bad credentials.', 0, $authenticationException); }`／「ログイン ID に一致する管理者が存在しない｜認証エラーとして扱う」 | MemberProvider.php:92-95／AuthenticatorManager.php:263-266,279-284／m01-01md:148,236 | 0 `non-translated` |
| L1-M0101-014 | auth_rule | 停止中の管理者はユーザロード対象外（`work_id=Work::ACTIVE(1)` のみロード。`NON_ACTIVE=0` は不存在扱い）→ 認証エラー（同一2行） | standard-src＋設計書md | `findOneBy(['login_id' => $identifier, 'work_id' => Work::ACTIVE])`（LoginMemberView経路）／`findOneBy(['login_id' => $identifier, 'Work' => Work::ACTIVE])`／`public const NON_ACTIVE = 0;`…`public const ACTIVE = 1;`／「停止中の判定は、管理者ロード時に有効状態の管理者のみを対象にすることで行う」 | MemberProvider.php:76-95／Work.php:32,37／m01-01md:149,237,282 | 0 `non-translated` |
| L1-M0101-015 | auth_rule | パスワード不一致は認証エラー（同一2行）。照合はハッシュ照合（`Eccube\Entity\Member`: algorithm auto・legacy migrate） | standard-src＋設計書md | `Eccube\Entity\Member:`＋`    algorithm: 'auto'`＋`    migrate_from:`＋`        - legacy`／「パスワードが不一致｜認証エラーとして扱う」 | security.yaml:13-16／m01-01md:150,238 | 0 `non-translated` |
| L1-M0101-016 | display | 失敗理由（存在有無・停止・ログイン不可・不一致・CSRF不整合・未入力）は**画面上で区別しない**（全て同一2行。理由区分はログイン履歴/サーバログ側） | 設計書md | 「管理者の存在有無、停止状態、ログイン不可状態、パスワード不一致は画面上では区別しない。内部的な失敗理由区分はログイン履歴またはサーバログで扱う」 | m01-01md:161,193,217 | 0 `non-translated`（文言実値はL1-009/010） |
| L1-M0101-017 | status_transition | 認証成功（追加認証不要）→ `default_target_path: admin_homepage`（`/%eccube_admin_route%/`）へ遷移。**成功メッセージなし**（本機能はaddFlash等で固定文言をセットしない） | standard-src＋設計書md | `default_target_path: admin_homepage`／「ID・パスワード認証成功（追加認証不要）｜成功メッセージなし。ホーム画面へ遷移する」「本機能のログイン処理は `addFlash` 等で固定の成功・失敗メッセージをセットしない」 | security.yaml:47／m01-01md:152,201,207 | 0 `non-translated` |
| L1-M0101-018 | db_effect(セッション) | 成功時、セッションに `eccube_mall_connection.admin`（role/base_info/member_id）と `enterprise.temp_post_member_login_action_required`（=true）が設定される | standard-src＋設計書md | `public const string SESSION_ACTIVE_DYNAMIC_CONN_ADMIN = 'eccube_mall_connection.admin';`／`$event->getRequest()->getSession()->set(EccubeRoleConnection::SESSION_ACTIVE_DYNAMIC_CONN_ADMIN, [ 'role' => …, 'base_info' => …, 'member_id' => … ]); … set(Constant::TEMP_POST_MEMBER_LOGIN_ACTION_REQUIRED, true);`／`public const string TEMP_POST_MEMBER_LOGIN_ACTION_REQUIRED = 'enterprise.temp_post_member_login_action_required';`／設計md「現行実装のセッションキー」表 | EccubeRoleConnection.php:35／SecurityListener.php:41-47／EccubeAuthenticationSuccessHandler.php:63-69／Constant.php:47／m01-01md:431-435 | 0 `non-ui-observable` |
| L1-M0101-019 | db_effect | 成功履歴＋最終ログイン日時: `enterprise.temp_post_member_login_action_required` が存在するログイン後の管理画面リクエスト（`admin_login` URL以外）で、`dtb_login_history` に成功区分（`login_history_status_id=1`）行（`user_name`=ログインID・`member_id`・`base_info_id`・`client_ip`）を登録し、`dtb_member.login_date` を現在日時へ更新してflushする | standard-src＋設計書md | `$LoginHistory->setLoginUser($user)->setUserName($user->getUsername())->setStatus($Status)->setBaseInfo($user->getBaseInfo())->setClientIp($request->getClientIp());`…`$user->setLoginDate(new \DateTime());`…`$this->entityManager->flush();`／`public const SUCCESS = 1;`／「登録｜dtb_login_history｜認証成功時に成功区分（status_id=1）で履歴を1件登録する」「更新｜dtb_member｜認証成功時に login_date（最終ログイン日時）を更新する」 | LoginHistoryListener.php:55-93／LoginHistoryStatus.php:37／m01-01md:306,308,406 | 0 `non-ui-observable` |
| L1-M0101-020 | db_effect | 失敗履歴: 認証失敗（LoginFailureEvent）で `dtb_login_history` に失敗区分（`login_history_status_id=0`）行を生SQL INSERT。ログインIDから管理者を特定できない失敗では `member_id=NULL`・`base_info_id`=root既定。`user_name`=入力されたログインID | standard-src＋設計書md | `'INSERT INTO dtb_login_history (member_id, user_name, login_history_status_id, client_ip, base_info_id, create_date, update_date) VALUES …'`…`'member_id' => $Member ? $Member->getId() : null,`／`public const FAILURE = 0;`／「登録｜dtb_login_history｜認証失敗時に失敗区分（status_id=0）で履歴を1件登録する。ログイン ID から管理者を特定できない失敗では member_id を NULL とする」 | LoginHistoryListener.php:95-141／LoginHistoryStatus.php:32／m01-01md:292,307,407 | 0 `non-ui-observable` |
| L1-M0101-021 | db_effect | 認証失敗時は `dtb_member.login_date` を**更新しない**（login_date更新は成功経路 `onPostLogin` のみ。失敗経路 `onAuthenticationFailure` にlogin_date更新なし＝関数全文にsetLoginDate/dtb_member UPDATE不存在）。成功区分行も追加されない | standard-src＋設計書md | 成功経路のみ `$user->setLoginDate(new \DateTime());`（onPostLogin内）。onAuthenticationFailure（95-141行）のSQL対象は `dtb_login_history` のみ／「更新｜dtb_member｜認証成功時に login_date…を更新する。**認証失敗時は更新しない**」 | LoginHistoryListener.php:88-91,95-141／m01-01md:308 | 0 `non-ui-observable` |
| L1-M0101-022 | throttle_rule | 試行制限=Symfony Security `login_throttling`（`app.login_rate_limiter`=DefaultLoginRateLimiter）。**固定窓（fixed_window）**・limit=`eccube_login_throttling_max_attempts`（**基準値5**）・interval=`eccube_login_throttling_interval`（**'30 minutes'**）・保存先=Redisのrate limiter cache。**環境上書きに注意**: dev=30（dev/eccube.yaml:2）・prod E2E override=**1000**（prod/eccube_e2e_login_throttling.yaml:5。同ファイル注記「E2Eをやめる場合はこのファイルを削除して cache:clear すれば既定(5)に戻る」）＝実行環境の実効値は要実機確認 | standard-src＋設計書md | `login_throttling:`＋`    limiter: app.login_rate_limiter`／`app.login_rate_limiter:`＋`  class: Symfony\Component\Security\Http\RateLimiter\DefaultLoginRateLimiter`／`login_local:`＋`  policy: fixed_window`＋`  limit: '%eccube_login_throttling_max_attempts%'`＋`  interval: '%eccube_login_throttling_interval%'`＋`  cache_pool: 'rate_limiter.cache.redis'`（login_globalも同型）／`eccube_login_throttling_max_attempts: 5`・`eccube_login_throttling_interval: '30 minutes'`／「固定窓方式で 5 回 / 30 分の上限を持ち、Redis の rate limiter cache に状態を保存する」 | security.yaml:62-63／services.yaml:554-559／framework.yaml:76-85／eccube.yaml:284-285／dev/eccube.yaml:2／prod/eccube_e2e_login_throttling.yaml:1-5／m01-01md:389-390 | 0 `non-translated` |
| L1-M0101-023 | throttle_rule | 判定単位=**2系統**: global（IPアドレス単体のhash）＋local（小文字化username＋`-`＋IPのhash）。limitは両系統とも同値（基準5）＝同一IPからは別ログインIDでもglobal側で制限に到達する | standard-src＋設計書md | `return [ $this->globalFactory->create($this->hash($request->getClientIp())), $this->localFactory->create($this->hash($username.'-'.$request->getClientIp())), ];`（usernameは `mb_strtolower`）／「判定単位｜ログイン ID と IP アドレスの組み合わせ、および IP アドレス単体」 | DefaultLoginRateLimiter.php:43-51／m01-01md:219,394 | 0 `non-translated` |
| L1-M0101-024 | message | 制限時の表示（`TooManyLoginAttemptsAuthenticationException`・validatorsドメイン解決）: 分数あり=ja「ログイン試行回数が多すぎます。{N}分後に再度お試しください。」（`%minutes%`=`ceil((retryAfter-now)/60)`）／分数なし（threshold 0/null）=ja「ログイン試行回数を超えました。しばらくして再度お試しください。」。**en文言は未確定**: `validators.en.yaml` に該当キーが存在しない（grep実測0件）。translator fallback=`['%locale%']`（framework.yaml:5-6）のためen表示の実値は**要実機**（-EN行は保留＝§5） | standard-src＋設計書md | `return 'Too many failed login attempts, please try again '.($this->threshold ? 'in %minutes% minute'.($this->threshold > 1 ? 's' : '').'.' : 'later.');`／`throw new TooManyLoginAttemptsAuthenticationException(ceil(($limit->getRetryAfter()->getTimestamp() - time()) / 60));`／`Too many failed login attempts, please try again later.: ログイン試行回数を超えました。しばらくして再度お試しください。`／`Too many failed login attempts, please try again in %minutes% minutes.: ログイン試行回数が多すぎます。%minutes%分後に再度お試しください。`（minute単数形も同訳） | TooManyLoginAttemptsAuthenticationException.php:35-38／LoginThrottlingListener.php:47-57／validators.ja.yaml:25-27／m01-01md:182-183,377 | 1（**ja確定・en未確定**） |
| L1-M0101-025 | throttle_rule | 制限判定は**認証成立前**（CheckPassportEvent。制限到達時は資格情報の照合前に例外）。**成功時は対象リミッターをリセット**（LoginSuccessEventでreset） | standard-src＋設計書md | `$limit = $this->limiter->peek($request); … throw new TooManyLoginAttemptsAuthenticationException(…)`／`public function onSuccessfulLogin(LoginSuccessEvent $event): void { … $this->limiter->reset($event->getRequest()); }`／「判定タイミング｜ログイン送信時、認証成立前に評価する」「成功時リセット｜ログイン成功時に対象リミッターをリセットする」 | LoginThrottlingListener.php:44-57,63-67／m01-01md:394,398 | 0 `non-translated`（文言はL1-024） |
| L1-M0101-026 | auth_rule | 二段階認証: `two_factor_auth_enabled=true` の管理者はID/PW認証成功後、2FA未認証（認証Cookie検証不成立）の間、管理画面コントローラ実行前に **`admin_two_factor_auth`（`/%eccube_admin_route%/two_factor_auth/auth`・キー設定済）または `admin_two_factor_auth_set`（キー未設定）へ302** される（除外route=admin_two_factor_auth等のみ）＝追加認証完了まで保護画面を利用できない。前提: SUT全体の2FA有効化 `eccube_2fa_enabled`（env `ECCUBE_2FA_ENABLED`）＝実効値は要実機 | standard-src＋設計書md | `if ($Member instanceof Member && $Member->isTwoFactorAuthEnabled() && !$this->twoFactorAuthService->isAuth($Member)) { if ($Member->getTwoFactorAuthKey()) { $url = $this->router->generate('admin_two_factor_auth', …); } … $event->setController(fn () => new RedirectResponse($url, $status = 302)); }`／`#[Route(path: '/%eccube_admin_route%/two_factor_auth/auth', name: 'admin_two_factor_auth', methods: ['GET', 'POST'])]`／「ID・パスワード認証成功、かつ追加認証が必要｜追加認証画面へ誘導する」「二段階認証が必要な管理者は、ID・パスワード認証が成功しても、追加認証完了まで保護された管理画面を利用できない」 | TwoFactorAuthListener.php:76-89／TwoFactorAuthController.php:39／eccube.yaml:252／m01-01md:151,241,332,349 | 0 `non-translated` |
| L1-M0101-027 | display | 2FA誘導時、ログイン画面のエラー欄に認証失敗文言を**出さない**（追加認証画面へ遷移するのみ） | 設計書md | 「ID・パスワード認証成功（二段階認証が必要）｜上記エラー欄には出さない。追加認証画面へ遷移する」 | m01-01md:202 | 0 `non-translated` |
| L1-M0101-028 | auth_rule | 管理者Remember Me設定: `always_remember_me: true`（明示チェック項目なしで有効）・lifetime=**86400秒**・Cookie名=`eccube_rememberme_admin_cookie_name`＝**`eccube_admin_remember_me`**・`secure: true`・`samesite: none`・サーバ側保存=Redis token provider | standard-src＋設計書md | `remember_me:`＋`    secret: '%kernel.secret%'`＋`    lifetime: 86400`＋`    name: '%eccube_rememberme_admin_cookie_name%'`＋`    always_remember_me: true`＋`    secure: true`＋`    samesite: none`＋`    token_provider:`＋`      service: eccube.rememberme.redis_token_provider.member`／`eccube_rememberme_admin_cookie_name: eccube_admin_remember_me`／設計md「管理者 Remember Me」表（Cookie名・86400秒・自動有効・Secure/SameSite=None・Redis token provider） | security.yaml:53-61／eccube.yaml:307／m01-01md:461-469 | 0 `non-translated` |
| L1-M0101-029 | status_transition | Remember Me再確立: 管理セッションなし＋`eccube_admin_remember_me` Cookieありで `admin_homepage` へアクセスすると **`admin_login?consume_remember_me=true` へ302**（専用リスナー）→ ログイン画面リクエスト上でRemember Me認証が成立し、ROLE_ADMIN到達により `admin_homepage` へ遷移（=「管理ログイン画面への遷移を経て」再確立） | standard-src＋設計書md | `#[AsEventListener(event: CheckPassportEvent::class, method: 'redirectToLoginOnRememberMeTokenAuth', priority: 257)]`／`$response = new RedirectResponse($this->urlGenerator->generate('admin_login', ['consume_remember_me' => true]), Response::HTTP_FOUND);`（remember_me cookieあり・admin_homepage配下・非ログインURLのとき）／`if ($this->authorizationChecker->isGranted('ROLE_ADMIN')) { return $this->redirectToRoute('admin_homepage'); }`／「Remember Me Cookie だけがある｜管理ログイン画面への遷移を経て、Cookie とサーバ側情報により認証状態を再確立する」 | EnterpriseEccubeRememberMeRedirectListener.php:26,38-64／AdminController.php:71-73／m01-01md:135,242,350 | 0 `non-translated` |
| L1-M0101-030 | status_transition | 明示ログアウト（`GET /%eccube_admin_route%/logout`）→ 管理セッション終了・`admin_login`（ログイン画面）へ。専用メッセージなし・ログイン履歴には保存しない。**「履歴に保存しない」の実挙動検証はBC-DRAFT-m01-01-1（§9-8）の影響下**: フラグ未削除の場合、ログアウトGET自体が成功区分INSERT契機になりうる（LoginHistoryListener.php:66-67の早期returnは `admin_login` URI含有のみで `/logout` は非除外＝str_contains不成立。リスナー実行順は未検証＝要実機） | standard-src＋設計書md | `logout:`＋`    path: admin_logout`＋`    target: admin_login`／「明示ログアウト時は管理セッションを終了し、ログイン画面へ戻る」「明示ログアウト｜専用メッセージなし」「ログアウト・自動ログアウト｜…ログイン履歴には保存しない」 | security.yaml:64-66／LoginHistoryListener.php:66-67／m01-01md:137,205,352,410 | 0 `non-translated` |
| L1-M0101-031 | display_field | 認証失敗後のログイン画面再表示で、直近入力のログインIDが入力欄に再表示される（フォーム初期値=セッション `_security.last_username`。設計mdは「保持する場合がある」とヘッジ・フォーム定義上は常時参照） | standard-src＋設計書md | `'data' => $this->session->get('_security.last_username'),`／「`_security.last_username`｜認証試行後に直近入力のログイン ID を保持し、入力欄の再表示などに利用する」「認証失敗｜直近入力のログイン ID を再表示用に保持する場合がある」 | LoginType.php:46／m01-01md:360,433 | 0 `data-passthrough` |
| L1-M0101-032 | auth_rule | 認証対象=`dtb_member` の有効（work_id=1）管理メンバーのみ（admin firewall `provider: member_provider`）。一般フロント会員（`dtb_customer`）は管理画面の認証主体ではない＝フロント会員の資格情報では管理ログイン不可・フロント会員セッションでも保護管理画面は未認証扱い（ログイン画面へ誘導） | standard-src＋設計書md | `admin:`＋`    pattern: ['^/%eccube_admin_route%/',…]`＋`    provider: member_provider`／「認証対象｜管理者として登録され、ログイン可能な状態の管理メンバーだけを認証対象とする。一般フロント会員は管理画面の認証主体ではない」「一般フロント会員のみ｜管理ログイン画面は開ける。｜管理者ではないため利用不可」 | security.yaml:40-42／MemberProvider.php:74-99／m01-01md:215,334 | 0 `non-translated` |
| L1-M0101-033 | display | **4状態（ログイン・ログアウト・自動ログアウト・Remember Me再確立）のいずれも**専用モーダル・確認ダイアログを表示しない。観測範囲=各状態の操作経路（ログイン画面DOMと送信時挙動=C-013／ログアウトGET遷移=C-061／Remember Me再確立の302経路=C-060／自動ログアウト後の復帰画面=C-062〔実行保留〕）でmodal/dialog要素・ダイアログ介在が無いこと。login.twig全文にmodal要素0件=grep実測 | 設計書md＋standard-src | 「ログイン、ログアウト、自動ログアウト、Remember Me 再確立のいずれも専用モーダルや確認ダイアログを表示しない。失敗理由はログイン画面上のメッセージで扱う」／login.twig（全51行）にmodal/dialog要素なし | m01-01md:106／login.twig:1-51 | 0 `non-translated` |
| L1-M0101-034 | 非UI(JS挙動) | ログイン可否は**サーバ側の認証基盤で判定**する。本機能固有の非同期ログイン・リアルタイムID検証・パスワード強度表示は無い（送信は `form#form1` の同期POSTのみ） | 設計書md＋standard-src | 「ログイン可否はサーバ側の認証基盤で判定する。本機能固有の非同期ログイン、リアルタイム ID 検証、パスワード強度表示は扱わない」／`<form name="form1" id="form1" method="post" action="{{ path('admin_login') }}">` | m01-01md:104／login.twig:22 | 0 `non-translated` |
| L1-M0101-035 | request契約 | 送信パラメータ契約: `username_parameter: 'login_id'`・`password_parameter: 'password'`・CSRF=`_csrf_token`（form_login既定 `csrf_parameter: '_csrf_token'`・`csrf_token_id: 'authenticate'`＝画面hiddenの `csrf_token('authenticate')` と一致）。ログインIDは**認証照合用の送信値**であり、この送信だけでは `dtb_member.login_id` 列へ書き込まない | standard-src＋設計書md | `username_parameter: 'login_id'`＋`password_parameter: 'password'`／`'csrf_parameter' => '_csrf_token',`＋`'csrf_token_id' => 'authenticate',`／`<input type="hidden" name="_csrf_token" value="{{ csrf_token('authenticate') }}">`／「認証照合用の送信値。管理者レコードのログイン ID 列へはこの送信だけでは書き込まない」 | security.yaml:48-49／FormLoginAuthenticator.php:61-62／login.twig:23／m01-01md:226 | 0 `non-ui-observable` |
| L1-M0101-036 | **TBD** | 「本機能はバッチを起動しないこと」＝**universal negative**。不起動の網羅立証（全コードパスでのバッチ起動不存在）は観測契約が定義できず具体オラクル化不能。**未確定オラクル台帳へ**（観測可能な隣接claimはL1-037として分離・補完行で担保） | 設計書md | 「バッチ｜本機能はバッチを起動しない。管理者状態やパスワードが別処理で変更済みの場合、次回ログイン送信時にその時点の永続化済みデータを読む」 | m01-01md:263 | — |
| L1-M0101-037 | db_effect | 管理者状態やパスワードが別処理で変更済みの場合、**次回ログイン送信時にその時点の永続化済みデータを読んで判定**する（例: パスワード変更後は旧パスワードで失敗・新パスワードで成功） | 設計書md | 「管理者状態やパスワードが別処理で変更済みの場合、次回ログイン送信時にその時点の永続化済みデータを読む」 | m01-01md:263 | 0 `non-ui-observable` |
| L1-M0101-038 | db_effect(Cookie) | セッションCookie設定（framework session）: name=env `ECCUBE_COOKIE_NAME`・cookie_lifetime=env `ECCUBE_COOKIE_LIFETIME`・gc=env `ECCUBE_GC_MAXLIFETIME`（いずれも環境値＝実値固定しない）・**`cookie_httponly: true`（固定）**・`cookie_secure: auto`・`cookie_samesite: none` | standard-src＋設計書md | `session:`…`name: '%env(ECCUBE_COOKIE_NAME)%'`＋`cookie_lifetime: '%env(ECCUBE_COOKIE_LIFETIME)%'`＋`gc_maxlifetime: '%env(ECCUBE_GC_MAXLIFETIME)%'`＋`cookie_httponly: true`＋`cookie_secure: auto`＋`cookie_samesite: none`／設計md「セッション用 Cookie」表（HttpOnly true・Secure auto・SameSite None） | framework.yaml:12-20／m01-01md:450-457 | 0 `non-ui-observable` |
| L1-M0101-039 | status_transition | 自動ログアウト: 追加システム設定「管理画面自動ログアウト時間（分）」の値を超える無操作で自動ログアウト（`admin_login`/`admin_logout` は判定除外route）。専用メッセージなし・履歴非保存。**実行は時間・設定依存＝実行保留** | standard-src＋設計書md | 「追加システム設定で設定した『管理画面自動ログアウト時間（分）』の値を使用して、一定時間操作がない場合に自動的にログアウトさせる」（クラスdocblock）／`private const ROUTE_EXCLUDE = [ 'admin_login', 'admin_logout', ];`／「無操作時間が設定値を超えた場合、自動ログアウト扱いとなり再ログインが必要になる」「自動ログアウト｜専用メッセージなし」 | AdminAutoLogoutListener.php:29-47,103／m01-01md:136,204,351,379 | 0 `non-translated` |

計**39行＝38claim確定＋L1-M0101-036 TBD**。

## §2 SEED三段参照設計

三段参照: `L1 claim（期待の正） → fixture_version（SEEDセットID@manifest_sha1） → 実値`。固定値は**入力の再現手段**で
あり期待値の正にしない。全て `@TBD-D5`。**SEED-M01系は実SQLが `e2e/seed/sets/m01/` に実装済み**（本候補はそれを
三段参照の対象として再利用。fixture_version確定はD5）。

| SEEDセットID | 目的 | 固定値（実SQL実測） | 後始末 |
|---|---|---|---|
| SEED-M01-ADMIN | 有効管理者（2FA OFF） | `dtb_member` id=900000901・login_id=`e2e_admin`・work_id=1・two_factor_auth_enabled=false・is_auto_logout=false・平文PW=`password`（bcrypt格納） | UPSERTべき等・login_date更新系ケース後は再適用不要（更新自体が仕様） |
| SEED-M01-DISABLED | 停止中管理者 | id=900000902・login_id=`e2e_disabled`・**work_id=0**・PW=`password` | UPSERTべき等 |
| SEED-M01-2FA-ON | 2FA有効管理者 | id=900000903・login_id=`e2e_2fa`・two_factor_auth_enabled=true・two_factor_auth_key=`JBSWY3DPEHPK3PXP`・PW=`password` | UPSERTべき等 |
| SEED-M01-CUSTOMER | 一般フロント会員 | `dtb_customer` id=900000904・email=`e2e-m01-customer@example.test`・PW=`password` | UPSERTべき等 |
| SEED-M01-LOCK | 試行制限専用管理者 | id=900000905・login_id=`e2e_lock`・PW=`password`。**RateLimiter状態（Redis）はSQL外**＝spec/setupで連続失敗生成＋テスト前初期化が必要（SEED SQL冒頭コメントに明記） | UPSERTべき等＋**Redisリミッタ状態の初期化ハーネスは未実装（§9）** |

- 履歴系ケース（C-021/035/036/037/039）は照会を **run内ブラケット**（操作前後の `dtb_login_history` 差分・
  `user_name`/`client_ip`/`login_history_status_id` 条件付き）で行い、既存履歴行に依存しない（フレッシュDB不要設計）。
- 試行制限系（C-050/051/052）は**専用login_id（e2e_lock）＋隔離環境必須**（§7・§9）。

## §3 画面項目／認証状態マトリクス

三値比較: 設計書md（入力項目表:224-229・バリデーション:312-321）／ee Form（LoginType.php）／ee 認証基盤
（FormLoginAuthenticator・MemberProvider）。**設計md:107,228-229は「CSRF（hidden）」と「なりすまし対策トークン
（hidden）」を別項目として記載するが、ee実装のログインフォームのhiddenトークンは `_csrf_token` 1個のみ**
（login.twig:23。LoginTypeは `'csrf_protection' => false`〔LoginType.php:62-67〕でForm自動CSRF無効＝md:321
「Symfony Form の自動 CSRF はログインフォームでは無効化され、画面上の `_csrf_token` を用いる」が調停根拠。
不一致ではなく同一実体の2記載と判定）。

### 3a. 入力項目

| 項目 | 必須/任意 | 最大長（UI層maxlength属性） | 最小長 | 未入力時（層別） | 根拠 |
|---|---|---|---|---|---|
| ログインID（`login_id`・text） | 必須（NotBlank→required属性） | **50**（属性のみ。Form層Length制約なし＝50字/51字とも文字数エラーは出ない。51字はUI層で切詰） | 事前チェックなし（1字可） | UI層=HTML5 `valueMissing` 送信ブロック／サーバ層（直接POST）=認証失敗2行 [L1-011,L1-012] | LoginType.php:39-47／eccube.yaml:109／m01-01md:226,316 |
| パスワード（`password`・password） | 必須（同上） | **50**（同上） | 下限チェックなし（最小桁は顧客ログイン専用＝md:317） | 同上 [L1-011,L1-012] | LoginType.php:48-55／eccube.yaml:196／m01-01md:227,317 |
| `_csrf_token`（hidden） | 必須（不整合は受理しない） | — | — | 不整合/欠落=認証不成立・同一2行 [L1-010] | login.twig:23／security.yaml:44／m01-01md:228-229,321 |

### 3b. 認証状態×結果マトリクス（判定順序=md:143-152）

| # | 状態（入力/管理者/制限） | 結果（遷移・表示・DB） | L1 |
|---|---|---|---|
| 1 | ID/PW未入力 | 認証不成立・2行（UI層はHTML5ブロック） | L1-011,L1-009 |
| 2 | `_csrf_token` 不整合 | 認証せず2行 | L1-010 |
| 3 | 試行制限該当 | 照合前に拒否・制限文言 | L1-022〜025 |
| 4 | ログインID不存在 | 認証エラー2行・失敗履歴member_id=NULL | L1-013,L1-020 |
| 5 | 停止中（work_id=0） | 認証エラー2行（ロード対象外） | L1-014,L1-020 |
| 6 | パスワード不一致 | 認証エラー2行・失敗履歴 | L1-015,L1-020,L1-021 |
| 7 | 成功＋2FA必要 | 追加認証へ302・エラー欄なし | L1-026,L1-027 |
| 8 | 成功＋2FA不要 | admin_homepageへ・成功メッセージなし・セッションキー設定・成功履歴＋login_date | L1-017,L1-018,L1-019 |
| — | ログイン済みでlogin GET | ホームへリダイレクト・メッセージなし | L1-008 |
| — | Remember Me Cookieのみ | login?consume_remember_me経由で再確立 | L1-028,L1-029 |
| — | ログアウトGET | セッション終了・ログイン画面・履歴非保存 | L1-030 |

## §4 実行可能グレード14列TSV（候補・**自己完結＝全45行を実体掲載**）

記法: 期待結果セルは三段参照 `…実値… [L1:<oracle_id>; fixture:<SEEDセットID>@TBD-D5]`。
`%eccube_admin_route%` は環境値（既定 `admin`）。セレクタ: `#login_id`（login.twig:26・実機確認済み）・
`#password`（render由来・実機確認済み=login.page.ts:6）・送信ボタン `button[type="submit"]`（login.twig:37）・
エラー `.text-danger`（login.twig:33）・`input[name="_csrf_token"]`（login.twig:23）。
直接POSTのrequest契約は§6.1。en行はD15前提。

### §4.1 bound対応候補行（39行=ja34＋-EN5。§8の59対応表が参照する全行。改訂1でC-061/C-062を§4.2から昇格）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m01-01_admin_login_login	E2E-M0101C-001	IT-15	権限	P1	未ログインで保護管理URLへ直接アクセス→ログイン画面へリダイレクト	未ログイン（cookieなしcontext）	—	1. GET /%eccube_admin_route%/ 2. 遷移先URLと画面を確認	admin_login のログイン画面へリダイレクトされ業務画面（ホーム）は表示されない [L1:L1-M0101-001]				
m01-01_admin_login_login	E2E-M0101C-010	IT-25	表示	P1	未ログインでログインURLを開くとID・パスワード入力画面が表示される	未ログイン	—	1. GET /%eccube_admin_route%/login 2. #login_id・#password・送信ボタンの存在を確認	ログイン画面が表示され #login_id（text）・#password（password）・送信ボタンが存在する [L1:L1-M0101-004,L1-M0101-002]				
m01-01_admin_login_login	E2E-M0101C-011	IT-12	画面レイアウト	P2	ログイン画面の表示要素一式と共通レイアウト（ja）	未ログイン	—	1. ログイン画面を開く 2. form#form1（method=post・action=/%eccube_admin_route%/login）・input[name="_csrf_token"]（hidden・値非空）・#login_id・#password・送信ボタン文言を読む 3. エラー領域 .text-danger が初期表示では存在しないことを確認	form#form1内に hidden _csrf_token・ID欄・PW欄・送信ボタン「ログイン」が存在し、初期表示ではエラー文言が表示されない（エラー領域は失敗時のみ描画=login.twig:31-35） [L1:L1-M0101-004]				
m01-01_admin_login_login	E2E-M0101C-011-EN	IT-12	画面レイアウト	P3	送信ボタン文言（en）	未ログイン／locale=en	—	1. en UIでログイン画面を開く 2. 送信ボタン文言を読む	送信ボタン="Sign in" [L1:L1-M0101-004]				
m01-01_admin_login_login	E2E-M0101C-012	IT-12	JS挙動	P2	ログイン可否はサーバ側判定（非同期ログインなし）	未ログイン／SEED-M01-ADMIN	login_id=`e2e_admin`・password=`password`	1. ネットワーク監視下でID/PWを入力し送信 2. 発生リクエストを確認	送信時に POST /%eccube_admin_route%/login（同期フォーム送信）のみが発生し、入力中に認証系の非同期リクエストが発生しない [L1:L1-M0101-034,L1-M0101-002; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-013	IT-25	モーダル	P3	ログイン操作で専用モーダル・確認ダイアログが表示されない	未ログイン／SEED-M01-ADMIN	有効なID/PW	1. ログイン画面DOMのmodal/dialog要素有無を確認 2. 送信時にダイアログ介在なく遷移することを確認	ログイン画面にmodal/dialog要素が存在せず、送信は確認ダイアログなしで完了する [L1:L1-M0101-033; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-014	IT-03	画面遷移	P2	ログイン済みでログインURLを開くとホームへリダイレクト・メッセージなし	ログイン済（SEED-M01-ADMIN）	—	1. ログイン成功後 GET /%eccube_admin_route%/login 2. 遷移先と画面上のメッセージ有無を確認	ログイン画面を表示せず /%eccube_admin_route%/（admin_homepage）へリダイレクト・専用メッセージなし [L1:L1-M0101-008; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-015	IT-12	タイトル	P2	未ログインのログイン画面で<title>が「ログイン - {店舗名}」（ja）	未ログイン	—	1. ログイン画面を開く 2. document.title を読む 3. db.tsで SELECT shop_name FROM dtb_base_info（当該店舗）	title=`ログイン - ` + DBのshop_name（実行時値連結・完全一致） [L1:L1-M0101-005]				
m01-01_admin_login_login	E2E-M0101C-015-EN	IT-12	タイトル	P3	<title>（en）	未ログイン／locale=en	—	同上	title=`Login - ` + shop_name [L1:L1-M0101-005]				
m01-01_admin_login_login	E2E-M0101C-016	IT-25	プレースホルダ	P2	ログイン画面表示時のプレースホルダ（ja）	未ログイン	—	1. ログイン画面を開く 2. #login_id と #password の placeholder属性を読む	#login_id placeholder=「ログインID」・#password placeholder=「パスワード」 [L1:L1-M0101-004]				
m01-01_admin_login_login	E2E-M0101C-016-EN	IT-25	プレースホルダ	P3	プレースホルダ（en）	未ログイン／locale=en	—	同上	placeholder="ID"／"Password" [L1:L1-M0101-004]				
m01-01_admin_login_login	E2E-M0101C-017	IT-12	画面表示データ	P3	ページ下部に著作権表記が表示されエラーが出ない	未ログイン	—	1. ログイン画面を開く 2. footer部 small要素の文言を読む（{当年}=実行時西暦で解決）	`Copyright © 2000-{当年} EC-CUBE CO.,LTD. All Rights Reserved.` が表示され、エラー表示がない [L1:L1-M0101-006]				
m01-01_admin_login_login	E2E-M0101C-018	IT-02	送信値	P1	ログインIDは認証照合用の送信値でありdtb_member.login_id列を書き換えない	未ログイン／SEED-M01-ADMIN	login_id=`e2e_admin`・password=`password`	1. db.tsで送信前の dtb_member.login_id（id=900000901）を記録 2. ネットワーク監視下でログイン送信し、POSTボディのパラメータ名（login_id/password/_csrf_token）を確認 3. db.tsで login_id 再照会	POSTパラメータ=login_id・password・_csrf_token（契約どおり）かつ dtb_member.login_id=`e2e_admin` のまま不変（送信では書き込まない） [L1:L1-M0101-035; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-020	IT-25	操作起点	P1	正しいID/PWでログイン成功→ホームへ遷移・成功メッセージなし	未ログイン／SEED-M01-ADMIN	login_id=`e2e_admin`・password=`password`	1. ログイン画面でID/PWを入力し送信 2. 遷移先URLを確認 3. 画面上に成功メッセージ・エラー表示がないことを確認	/%eccube_admin_route%/（admin_homepage）へ遷移し、成功メッセージ・エラーとも表示されない（必須・相関・DB相関のいずれのエラーも出ず認証照合が完了） [L1:L1-M0101-017,L1-M0101-013,L1-M0101-015; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-021	IT-26	登録内容	P1	ログイン成功でdtb_login_historyに成功区分行が追加される	未ログイン／SEED-M01-ADMIN	login_id=`e2e_admin`・password=`password`	1. db.tsでT1=SELECT now() 2. ログイン成功しホーム表示 3. db.tsで dtb_login_history（user_name=`e2e_admin` AND login_history_status_id=1 AND create_date>=T1）の行数を照会	成功区分（login_history_status_id=1）の履歴行が新規追加され、user_name=入力ログインID・member_id=900000901・client_ipが記録される（件数≥1。厳密件数はBC-DRAFT-m01-01-1=§9-8のため断定しない） [L1:L1-M0101-019; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-022	IT-26	更新内容	P1	ログイン成功でdtb_member.login_dateが更新される（ブラケット法）	未ログイン／SEED-M01-ADMIN（login_date=NULL初期）	login_id=`e2e_admin`・password=`password`	1. db.tsでT1=SELECT now() 2. ログイン成功しホーム表示 3. db.tsでT2=SELECT now()・login_date照会（id=900000901）	T1≦dtb_member.login_date≦T2（最終ログイン日時が今回ログインで更新される） [L1:L1-M0101-019; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-030	IT-22	認証失敗	P1	パスワード不一致で同一2行の認証失敗となる（ja）	未ログイン／SEED-M01-ADMIN	login_id=`e2e_admin`・password=`wrong-password-<runid>`	1. 誤パスワードで送信 2. .text-danger の文言と滞留を確認	ログイン画面に留まり .text-danger に「ログインできませんでした。」＋「入力内容に誤りがないかご確認ください。」の2行（nl2br改行付き）が表示される [L1:L1-M0101-015,L1-M0101-009,L1-M0101-016; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-030-EN	IT-22	認証失敗	P2	認証失敗2行（en）	未ログイン／SEED-M01-ADMIN／locale=en	同上	同上	"Failed to sign in."＋"Please make sure if the credentials are correct." の2行 [L1:L1-M0101-009]				
m01-01_admin_login_login	E2E-M0101C-031	IT-22	必須	P1	ID/PW未入力はHTML5層で送信ブロック・ログイン処理が発生しない	未ログイン	login_id=空（PW側も同型で実施）	1. 空のまま送信ボタン押下 2. #login_id の validity.valueMissing を読む 3. ネットワーク監視でPOST不発生を確認 4. db.tsで dtb_login_history に当該期間の新規行が無いことを照会	送信されず valueMissing=true（NotBlank由来required属性）・POST不発生・履歴行も追加されない（ブラウザ既定文言はSUT外=期待にしない） [L1:L1-M0101-011,L1-M0101-012]				
m01-01_admin_login_login	E2E-M0101C-032	IT-22	必須	P1	未入力の直接POSTはサーバ層で認証失敗2行となる（フィールドエラーは出ない）	未ログイン（同一BrowserContext）	§6.1契約: login_id=""・password=""・正規_csrf_token	1. §6.1手順で空値を直接POST 2. 応答HTMLの .text-danger を読む 3. 「入力されていません。」が含まれないことを確認	認証失敗2行が表示され、Symfony Formのフィールド直下エラー「入力されていません。」は表示されない（未入力=認証失敗として扱う） [L1:L1-M0101-011,L1-M0101-009]				
m01-01_admin_login_login	E2E-M0101C-033	IT-22	相関	P1	停止中管理者は認証失敗となり同一2行が表示される	未ログイン／SEED-M01-DISABLED（work_id=0）	login_id=`e2e_disabled`・password=`password`（正しいPW）	1. 停止中管理者のID/正PWで送信 2. .text-danger の文言と滞留を確認	ログイン画面に留まり同一2行が表示される（停止中はロード対象外＝理由は画面で区別されない） [L1:L1-M0101-014,L1-M0101-009,L1-M0101-016; fixture:SEED-M01-DISABLED@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-034	IT-15	CSRF	P1	_csrf_token改変で認証不成立・同一2行（ja）	未ログイン（同一BrowserContext）／SEED-M01-ADMIN	§6.1契約: 正しいID/PW＋正規_csrf_tokenの末尾1文字を置換した改変値	1. §6.1手順で改変tokenを直接POST 2. 応答の .text-danger と非ログイン状態を確認 3. GET /%eccube_admin_route%/ でログイン画面へ誘導されることを確認	認証されず同一2行が表示され、管理画面は未認証のまま（保護URLはログインへ誘導） [L1:L1-M0101-010,L1-M0101-001; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-034-EN	IT-15	CSRF	P3	CSRF不整合2行（en）	未ログイン／locale=en	同上	同上	"Failed to sign in."＋"Please make sure if the credentials are correct."（認証失敗と同一文言） [L1:L1-M0101-010]				
m01-01_admin_login_login	E2E-M0101C-035	IT-22	DB相関	P1	存在しないログインIDは認証失敗2行・失敗履歴member_id=NULL	未ログイン	login_id=`e2e-noexist-<runid>`・password=任意	1. 不存在IDで送信 2. .text-danger 確認 3. db.tsで dtb_login_history（user_name=`e2e-noexist-<runid>`）を照会	同一2行表示＋失敗区分（login_history_status_id=0）行が追加され member_id が NULL・user_name=入力値 [L1:L1-M0101-013,L1-M0101-020,L1-M0101-009]				
m01-01_admin_login_login	E2E-M0101C-036	IT-26	更新抑止	P1	認証失敗時は成功区分行が追加されずlogin_dateも変更されない	未ログイン／SEED-M01-ADMIN	login_id=`e2e_admin`・password=`wrong-<runid>`	1. db.tsで失敗前の login_date と成功区分行数（user_name=`e2e_admin`）を記録 2. 誤PWで送信し2行表示を確認 3. db.tsで再照会	失敗区分行（status=0・user_name=`e2e_admin`・member_id=900000901）のみ追加され、成功区分行数は不変・dtb_member.login_date は記録値のまま不変 [L1:L1-M0101-020,L1-M0101-021; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-037	IT-26	境界	P2	最大長50字のログインIDが送信され失敗履歴に記録される（文字数エラーなし）	未ログイン	login_id=runFill(50,ascii,"E2E-<runid>-")（不存在ID）・password=任意	1. 50字IDを入力（maxlength=50内）し送信 2. .text-danger の2行を確認（文字数エラーが出ない） 3. db.tsで user_name=当該50字値の失敗行を照会	文字数超過エラーは表示されず認証失敗2行・失敗履歴に user_name=50字値の行が追加される [L1:L1-M0101-012,L1-M0101-020,L1-M0101-009]				
m01-01_admin_login_login	E2E-M0101C-038	IT-22	境界	P2	51字はmaxlength属性で50字に切り詰められ51字値の送信・記録が発生しない	未ログイン	login_id=runFill(51,ascii,"E2E-<runid>-")をfill	1. #login_id へ51字をfill 2. inputValueの文字数を読む 3. 送信後 db.tsで user_name=51字値の行が存在しないことを照会	入力値は50字に切り詰められ（maxlength=50属性）、51字のuser_name行はdtb_login_historyに追加されない（送信自体が50字で発生） [L1:L1-M0101-012,L1-M0101-020]				
m01-01_admin_login_login	E2E-M0101C-039	IT-22	境界	P2	1字のログインIDでも送信可能（下限チェックなし）で失敗履歴に記録される	未ログイン	login_id=`x`（1字・不存在）・password=任意	1. 1字IDで送信 2. .text-danger の2行を確認（下限エラーが出ない） 3. db.tsで user_name=`x` AND create_date≥T1 の失敗行を照会	下限バリデーションは発生せず認証失敗2行・失敗履歴（user_name=`x`）が追加される（最小桁チェックは顧客ログイン専用＝管理には無い） [L1:L1-M0101-012,L1-M0101-020,L1-M0101-009]				
m01-01_admin_login_login	E2E-M0101C-040	IT-03	画面遷移	P1	2FA有効管理者はID/PW成功後に追加認証画面へ遷移しエラー欄に出ない	未ログイン／SEED-M01-2FA-ON／SUT: eccube_2fa_enabled有効（要実機env確認=§9-6）	login_id=`e2e_2fa`・password=`password`	1. 2FA管理者のID/PWで送信 2. 遷移先URLを確認 3. 認証失敗2行が表示されないことを確認	/%eccube_admin_route%/two_factor_auth/auth（admin_two_factor_auth）へ302遷移し、ログイン画面のエラー欄には何も表示されない [L1:L1-M0101-026,L1-M0101-027; fixture:SEED-M01-2FA-ON@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-041	IT-26	実行結果	P2	2FA未完了でもID/PW成功時点の管理画面リクエストで成功履歴・login_date更新対象になる	未ログイン／SEED-M01-2FA-ON	login_id=`e2e_2fa`・password=`password`	1. db.tsでT1=now()とlogin_date記録 2. ID/PW送信→追加認証画面へ遷移 3. db.tsで成功区分行（user_name=`e2e_2fa`・create_date≥T1）の行数とlogin_dateを照会	成功区分行が追加され（**件数 count >= 1**。厳密件数はBC-DRAFT-m01-01-1=§9-8のため断定しない）login_dateが更新される（履歴リスナーは2FA完了を条件にしない=LoginHistoryListener.php:55-93に2FA条件なし） [L1:L1-M0101-019,L1-M0101-026; fixture:SEED-M01-2FA-ON@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-042	IT-03	画面遷移	P1	2FA未完了の状態で保護URLへ直接アクセスすると追加認証へ誘導される	2FA要求中（C-040直後の同一context）／SEED-M01-2FA-ON	—	1. ID/PW成功後（2FA未完了）に GET /%eccube_admin_route%/ 2. 遷移先URLを確認	業務画面は表示されず /%eccube_admin_route%/two_factor_auth/auth へ302誘導される（追加認証完了まで保護画面利用不可） [L1:L1-M0101-026; fixture:SEED-M01-2FA-ON@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-043	IT-25	フォーム送信	P1	一般フロント会員の資格情報では管理ログインできない	未ログイン／SEED-M01-CUSTOMER	login_id=`e2e-m01-customer@example.test`・password=`password`（有効なフロント会員資格情報）	1. フロント会員の資格情報で管理ログイン送信 2. .text-danger と滞留を確認	認証されず同一2行（管理ログインの認証対象はdtb_memberの有効メンバーのみ＝customerはロード対象外） [L1:L1-M0101-032,L1-M0101-009; fixture:SEED-M01-CUSTOMER@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-045	IT-15	未認証	P1	フロント会員としてログイン済みでも管理保護画面は利用できずログインへ誘導	フロント会員ログイン済（SEED-M01-CUSTOMER・フロント画面で認証）	—	1. フロント会員セッションのまま GET /%eccube_admin_route%/ 2. 遷移先を確認	管理業務画面は表示されず admin_login のログイン画面へ誘導される（admin firewallはmember_providerのため未認証扱い） [L1:L1-M0101-032,L1-M0101-001; fixture:SEED-M01-CUSTOMER@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-050	IT-22	試行制限	P1	同一ID+IPで上限回失敗すると次回は照合前に拒否され制限文言（分数あり）が表示される	未ログイン／SEED-M01-LOCK／**隔離環境必須**: 実効limit=基準5へ戻すenv（prod E2E上書き1000の解除=§9-5）＋Redisリミッタ初期化	login_id=`e2e_lock`・password=`wrong-<runid>`×5回→6回目	1. 誤PWで5回連続失敗 2. 6回目を送信（正PWでも可=照合前判定） 3. .text-danger の文言を確認	6回目はログイン不成立・「ログイン試行回数が多すぎます。{N}分後に再度お試しください。」（{N}=残り分数・最大30）が表示される [L1:L1-M0101-022,L1-M0101-024,L1-M0101-025; fixture:SEED-M01-LOCK@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-051	IT-22	試行制限	P2	同一IPでは別ログインIDでもIP単体（global）側で制限される	C-050の制限成立直後（同一IP）／SEED-M01-ADMIN	login_id=`e2e_admin`（別ID）・password=任意	1. C-050で制限成立後、同一IPから別IDで送信 2. .text-danger を確認	別IDでも制限文言が表示される（global=IP単体リミッターが同一limitのため。単位=ID+IPとIP単体の2系統の実証） [L1:L1-M0101-023,L1-M0101-024; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-052	IT-22	試行制限	P2	上限未満の失敗後にログイン成功するとリミッターがリセットされる	未ログイン／SEED-M01-LOCK／隔離環境（C-050と同前提）	誤PW×(limit-1)回→正PW成功→誤PW1回	1. 上限未満まで失敗 2. 正PWで成功（ホーム遷移） 3. ログアウト後、誤PWで1回失敗 4. 制限文言が出ないことを確認	成功時に対象リミッターがリセットされ、直後の1回失敗では制限にならない（2行の認証失敗のみ） [L1:L1-M0101-025,L1-M0101-009; fixture:SEED-M01-LOCK@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-060	IT-03	画面遷移	P2	Remember Me Cookieのみの状態でログイン画面経由により認証状態が再確立される（モーダル介在なし）	SEED-M01-ADMIN／ログイン成功後にセッションCookieのみ削除し eccube_admin_remember_me Cookieを保持	—	1. ログイン成功（always_remember_me=trueでRemember Me Cookie自動付与）を確認 2. セッションCookieだけをcontextから削除 3. GET /%eccube_admin_route%/ 4. リダイレクト経路と最終到達を確認 5. 再確立経路の全画面でmodal/dialog要素・ダイアログ介在が無いことを確認	admin_login?consume_remember_me=true への302を経て認証状態が再確立され、/%eccube_admin_route%/（ホーム）へ到達する。再確立の全経路で専用モーダル・確認ダイアログは表示されない [L1:L1-M0101-028,L1-M0101-029,L1-M0101-033; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-061	IT-03	画面遷移	P1	明示ログアウトでセッションが終了しログイン画面へ戻る（モーダル介在なし・履歴検証はBC影響下）	ログイン済（SEED-M01-ADMIN）	—	1. db.tsでT1=now() 2. GET /%eccube_admin_route%/logout（ダイアログ介在なく遷移することを確認） 3. 遷移先確認 4. GET /%eccube_admin_route%/ でログインへ誘導確認 5. db.tsでT1以降のdtb_login_history新規行を照会	admin_login のログイン画面へ戻り・専用メッセージなし・専用モーダル/確認ダイアログなし・再度保護URLはログインへ誘導（セッション終了）。ログアウト操作は失敗区分行・ログアウト区分行を追加しない（設計期待=履歴非保存〔md:410〕）。**※成功区分行の有無はBC-DRAFT-m01-01-1（§9-8）の影響範囲**: フラグ未削除の場合ログアウトGET自体が成功区分INSERT契機になりうる（/logoutはadmin_login URI除外に該当しない=LoginHistoryListener.php:66-67）＝設計期待との乖離が観測されたらBC-DRAFTへ確認情報を記録（要実機） [L1:L1-M0101-030,L1-M0101-003,L1-M0101-001,L1-M0101-033; fixture:SEED-M01-ADMIN@TBD-D5]				
m01-01_admin_login_login	E2E-M0101C-062	IT-03	画面遷移	P3	無操作時間超過で自動ログアウト扱いとなり再ログインが必要になる（モーダル介在なし）	ログイン済（SEED-M01-ADMIN・is_auto_logout=false）／自動ログアウト時間=追加システム設定値	—	（設定値超過の無操作後）1. 保護URLへアクセス 2. ログイン画面へ誘導・専用メッセージなしを確認 3. 誘導経路・復帰後のログイン画面にmodal/dialog要素が無いことを確認	未ログイン扱いに戻りログイン画面へ誘導・専用メッセージなし・専用モーダル/確認ダイアログなし [L1:L1-M0101-039,L1-M0101-033]（**実行保留**=時間・追加システム設定依存・設定値の一次資料はmtb option実データ=要実機）				
```

### §4.2 補完行（6行=ja5＋-EN1。**親test_idなし・母集合会計に算入しない**。理由=設計書補完〔一次資料に規定が
あるが、母集合59行の期待テキストに対応する親が存在しない〕。改訂1でC-061/C-062はIT-049の4状態被覆の
bind先となったため§4.1へ昇格＝本節から除外）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m01-01_admin_login_login	E2E-M0101C-023	IT-26	最新データ	P2	別処理でパスワード変更後は次回ログインが永続化済みデータで判定される	SEED-M01-ADMIN	旧PW=`password`／db.tsで password列を既知の別bcrypt値（新PW=`password2`相当）へ直接UPDATE	1. db.tsでpassword列を新ハッシュへ更新 2. 旧PWでログイン→失敗2行 3. 新PWでログイン→成功 4. 実行後SEED再適用	旧PWは認証失敗2行・新PWは成功（次回ログイン送信時にその時点の永続化済みデータを読む） [L1:L1-M0101-037,L1-M0101-009; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・親test_idなし・設計書補完）				
m01-01_admin_login_login	E2E-M0101C-063	IT-20	Cookie属性	P3	認証セッションCookieがHttpOnlyである	ログイン済（SEED-M01-ADMIN）	—	1. ログイン成功後 context.cookies() でセッションCookie（name=env ECCUBE_COOKIE_NAME・環境値）を取得 2. httpOnly属性を読む	セッションCookieの httpOnly=true（name/lifetime等のenv値・secure=auto/samesite=noneの実効値は環境依存＝固定期待にしない） [L1:L1-M0101-038; fixture:SEED-M01-ADMIN@TBD-D5]（補完行・親test_idなし・設計書補完）				
m01-01_admin_login_login	E2E-M0101C-064	IT-12	再表示	P2	認証失敗後に直近入力のログインIDが入力欄に再表示される	未ログイン	login_id=`e2e-last-<runid>`（不存在）・password=任意	1. 失敗送信 2. 再表示されたログイン画面の #login_id の value を読む	#login_id の値=直近入力の `e2e-last-<runid>`（_security.last_usernameによる再表示） [L1:L1-M0101-031]（補完行・親test_idなし・設計書補完）				
m01-01_admin_login_login	E2E-M0101C-065	IT-25	noscript	P3	JavaScript無効時のみnoscript文言が表示される（ja）	未ログイン／JS無効context（javaScriptEnabled:false）	—	1. JS無効でログイン画面を開く 2. noscript文言を読む 3. JS有効時は非表示であることを確認	JS無効時に「JavaScript を有効にしてご利用ください」が表示され、JS有効時は表示されない [L1:L1-M0101-007]（補完行・親test_idなし・設計書補完）				
m01-01_admin_login_login	E2E-M0101C-065-EN	IT-25	noscript	P3	noscript文言（en）	未ログイン／JS無効context／locale=en	—	同上	"Please enable JavaScript" [L1:L1-M0101-007]（補完行・親test_idなし・設計書補完）				
m01-01_admin_login_login	E2E-M0101C-066	IT-22	試行制限	P3	再試行までの分数が算出できない場合は分数なしの制限文言が表示される	制限成立済（C-050前提）／隔離環境	残り時間が1分未満（retryAfter−now≦0となる縁）で送信	1. 制限窓の残りが0分帯になるタイミングで送信 2. .text-danger を確認	「ログイン試行回数を超えました。しばらくして再度お試しください。」（threshold=0/null側の文言） [L1:L1-M0101-024]（補完行・親test_idなし・設計書補完。**実行保留**=残り0分帯の再現が時間依存で不安定＝既存実績E2E-M01-01-031×と同根） [fixture:SEED-M01-LOCK@TBD-D5]				
```

## §5 locale対応表

- LS=1 claim: **L1-004・L1-005・L1-007・L1-009・L1-010・L1-024 の6claim**。
- -EN行=**6行**（bound親従属5: C-011-EN・C-015-EN・C-016-EN・C-030-EN・C-034-EN／補完従属1: C-065-EN）。
  en文言はすべてen一次資料逐語（messages.en.yaml:1849,1877-1880／validators.en.yaml:19-24。ja翻訳ゼロ）。
- **保留（claim単位・理由明記）**: **L1-M0101-024（試行制限文言）の-EN行は作らない**。
  `validators.en.yaml` に `Too many failed login attempts…` キーが**存在しない**（grep実測0件。ja側のみ
  validators.ja.yaml:25-27）。translatorのfallbackは `['%locale%']`（framework.yaml:5-6）でありen表示の実値
  （英語原文か日本語fallbackか）は一次資料からは確定できない＝**en文言未確定・要実機**。捏造しない。
- -EN行の実行前提はD15（M0 Go/No-Go。管理画面のen切替口なし＝W0実測を継承）。
  文言確定は保留1claimを除き完了（5/6 claim=-EN行としては6行全行文言確定。L1-024のみ-EN行なし）。

## §6 判定手段骨子（候補=未実装）＋ _drafts隔離lint証跡

### §6.1 直接POSTのrequest契約（C-032・C-034で使用）

1. 同一BrowserContextで `GET /%eccube_admin_route%/login` を開き、`input[name="_csrf_token"]` の値を取得
   （`csrf_token('authenticate')`＝login.twig:23。セッションに紐づくため**同一contextのcookie必須**）。
2. `POST /%eccube_admin_route%/login` へ `application/x-www-form-urlencoded` で
   `login_id`・`password`・`_csrf_token` を送信（パラメータ名の根拠=security.yaml:48-49・
   FormLoginAuthenticator.php:61-62＝L1-035）。
3. 302追従後の応答HTMLで `.text-danger` を読む。C-034はtokenの末尾1文字を置換した改変値を送る。

### §6.2 実装方針（候補=未実装・実走なし）

- page: 既存 `e2e/pages/admin/login.page.ts` を再利用可能（#login_id・#password・.text-danger 実装済み・
  実機確認済み注記あり）。2FA遷移先は `e2e/pages/admin/two_factor_auth.page.ts`。
- spec: 既存 `e2e/spec/admin/login.spec.ts` は**旧ケース表（E2E-M01-01-xxx）1:1**の実装であり本候補の実装ではない
  （セレクタ・SEED運用の参考のみ）。本候補の期待値は `o("L1-M0101-xxx", "m01_01_oracle")` 相当のL1解決器経由・
  リテラル直書き禁止。DB照会は `e2e/helpers/db.ts`。境界値は `runFill(n, repertoire, prefix)`。
- 履歴照会は run内ブラケット（T1=now()以降・user_name/status条件付き）で既存データ非依存。
- 試行制限系はRedisリミッタ状態の生成/初期化ハーネスが**未実装**（§9-5）＝実装waveの前提整備項目。

### §6.3 _drafts/隔離lintの実施証跡（実測・実施済み）

1. 正式消費側（`e2e/helpers/oracle.ts`・`e2e/helpers/db.ts`・spec・pages）に草案を消費する `_drafts` 参照は
   **0件**（隔離ガード自体のリテラル〔oracle.ts:19〕を除く。ガードは `_drafts`・パス区切り・`..` を含むfileKeyの
   解決をthrowで拒否する機械強制＝消費参照ではない）。
2. 正式パス `e2e/fixtures/oracle/` 直下に本機能のjsonは**作成していない**（草案は `_drafts/` のみ）。
   既存正式物 `m09_01_oracle.json` は未変更。
3. 本md・oracle草案json（`e2e/fixtures/oracle/_drafts/m01-01_admin_login_login_oracle_draft.json`）の出力先は
   ともに `_drafts/` 配下のみ（CFP §7出力規約に適合）。

## §7 実行区分・多軸属性（暫定・D14 v2合格前は正式会計に使わない）

| ケース群 | 実行区分（候補） | 観測層 | 備考 |
|---|---|---|---|
| C-001,010,011,013,014,015,016,017,020,030,033,040,042,043,045,064（＋EN） | Playwright | GUI/HTTP | 表示・遷移・文言 |
| C-012,018,031 | Playwright | GUI+network(+DB) | ネットワーク監視・HTML5層 |
| C-021,022,023,035,036,037,038,039,041,061 | Playwright+手動確認→**db.ts実装後Playwright単独へ降格候補** | GUI+DB | 履歴・login_dateはdb.tsブラケット照会 |
| C-032,034（＋EN） | 非UI（request契約＋GUI応答読取） | HTTP+GUI | §6.1契約 |
| C-050,051,052 | Playwright+手動確認・**専用隔離環境必須（serial・他テストと並行不可）** | GUI(+Redis状態) | 実効limit復元（§9-5）＋リミッタ初期化が前提。IP固定必須 |
| C-060 | Playwright | GUI+Cookie | セッションCookieのみ削除する精密操作 |
| C-062,066 | 実行保留 | — | 時間依存（§9） |
| C-063 | Playwright | Cookie属性 | env名は環境値 |
| -EN 6行 | 実行保留（D15） | GUI | 文言確定済（L1-024の-ENは未作成=§5） |

聖域判定・多軸属性の正式付与はD14 v2合格後（本表は暫定・正式会計に使わない）。

## §8 func_scope_check 完了表（機能スコープ自己検査。**正式O6ではない**）

判定はすべて**期待テキスト実内容**による（§0判定原則。前提/入力列のシナリオ語はノイズ）。
1候補ケース行=1 assertion bundle・多対一は `shared-observation`・-EN行は対応ja行と同一親のlocale多重。
**参照先の全候補行は§4に実体掲載済み＝59↔候補の期待テキスト突合が本文内で完結する**。

### 集計（59 test_id 全数会計・差分0）

| 会計 | 件数 | 内訳 |
|---|---:|---|
| **bound** | **58** | 下表 |
| **TBD** | **1** | 034（バッチ不起動=universal negative・観測契約なし=L1-036） |
| **excluded** | **0** | 認証機能は生成器の汎用行（登録/更新/相関/DB相関）がすべて実在の認証副作用（履歴・login_date・DB照合）に対応するため過剰生成行なし |
| 合計 | **59** | 欠落0・理由なし重複0 |

- 候補ケース行総数**45**（§4.1 bound対応39＝ja34＋-EN5／§4.2 補完6＝ja5＋-EN1。改訂1でC-061/C-062昇格）。
- **極性・ノイズ処理の明示**（C4-manual対象=§10）:
  - 012〜017（相関・DB相関）は**excludedにしない**: 認証はID×パスワード組合せ照合（相関）と
    dtb_member照合（DB相関）が処理の本体であり、否定側（エラー表示・不成立）＝C-030/C-033/C-035、
    肯定側（エラーなし継続）＝C-020が実在（m05-16でのexcluded判定とは前提が異なる=constraint不存在
    ではなく認証基盤側に検証が実在）。**semantic bindの明示（codex指摘・改訂1）**: これは相関/DB相関の
    母集合汎用期待を**認証照合へ意味対応（semantic bind）したもの**であり、Symfony Formの相関バリデータ
    （constraint）の存在を意味しない（LoginTypeの制約はNotBlankのみ=LoginType.php:43-54。
    対応するL1出典は auth_rule/db_effect のまま＝validation_rule相当の過大主張をしない）。
  - 024〜027（最大長/最大長+1/最小長/最小長-1）は前提列のシナリオ語と期待極性を期待テキストで裁定:
    024「追加される」=50字送信でも履歴追加（C-037）／025「追加されない」=51字はmaxlength切詰で
    51字値の記録が発生しない（C-038）／026「追加される」=1字でも履歴追加=下限なし（C-039）／
    027「追加されない」=0字（未入力）はUI層送信ブロックでリクエスト不発生（C-031）。
  - 020/032/037/039の否定行は「失敗時に成功区分行なし・login_date不変」（C-036）で成立。
  - 018「なしであること」=ログイン済みでログインURLを開いたときの表示メッセージ「なし」（md:203）→C-014。

### 59対応表（期待テキスト→会計→候補ケース。**全対応先は§4に実体あり**）

| No | 期待テキスト要旨（逐語短縮） | 会計 | 対応候補ケース |
|---|---|---|---|
| 001 | ログインIDとパスワード等を認証基盤が照合し本人性を確認する処理であること | bound | C-020,C-030 (shared) |
| 002 | 未認証もしくは追加認証未完了では利用できない管理側の機能であること | bound | C-001,C-042,C-045 (shared) |
| 003 | 二段階認証など、パスワード成功後に要求される追加の本人確認であること | bound | C-040 |
| 004 | Cookieとサーバ側の保存情報で一定期間ログイン状態を再確立する仕組みであること | bound | C-060 |
| 005 | 失敗などの条件により一時的にログイン送信を拒否/遅延させる制御であること | bound | C-050 (shared) |
| 006 | 未ログイン時にログインID・パスワード入力画面を表示すること | bound | C-010 |
| 007 | 入力値、CSRF、試行制限、管理者状態、パスワードを評価し認証可否を判定すること | bound | C-020,C-030,C-034,C-050 (shared) |
| 008 | 未ログイン/追加認証未完了は業務画面を表示せずログイン/追加認証へ誘導すること | bound | C-001,C-042 (shared) |
| 009 | 必須バリでエラーが表示され対象処理が完了しないこと | bound | C-031(HTML5層),C-032(サーバ層=認証失敗2行) |
| 010 | 必須バリでエラーが表示されず継続できること | bound | C-020 (shared・両欄入力済で必須エラーなし) |
| 011 | 管理画面共通のログインフォーム・入力欄・エラー表示のレイアウトを使うこと | bound | C-011 |
| 012 | 相関バリでエラーが表示され完了しないこと | bound | C-030（ID×PW組合せ照合失敗=極性一致の実在ケース） |
| 013 | 相関バリでエラーが表示されず継続できること | bound | C-020 (shared) |
| 014 | 相関バリでエラーが表示されず継続できること | bound | C-020 (shared) |
| 015 | 相関バリでエラーが表示され完了しないこと | bound | C-030,C-033 (shared) |
| 016 | DB相関バリでエラーが表示されず継続できること | bound | C-020 (shared・DB照合成功) |
| 017 | DB相関バリでエラーが表示され完了しないこと | bound | C-035（DB照合失敗=不存在ID） |
| 018 | なしであること | bound | C-014（ログイン済み→ホーム・メッセージ「なし」=md:203） |
| 019 | 登録内容の対象レコードが追加されること | bound | C-021 |
| 020 | 追加され**ない**こと | bound | C-036（失敗時: 成功区分行が追加されない） |
| 021 | 追加されること | bound | C-021 (shared) |
| 022 | 固定窓方式でログインIDとIPアドレス、もしくはIP単体を単位に送信回数を制御すること | bound | C-050,C-051,C-052 (shared) |
| 023 | 追加されること | bound | C-021 (shared・user_name=入力ログインID) |
| 024 | 追加されること（入力=最大長） | bound | C-037 |
| 025 | 追加され**ない**こと（入力=最大長+1） | bound | C-038（51字値の記録が発生しない） |
| 026 | 追加されること（入力=最小長） | bound | C-039 |
| 027 | 追加され**ない**こと（入力=最小長-1） | bound | C-031 (shared・0字=送信ブロックでリクエスト不発生) |
| 028 | 追加されること | bound | C-021 (shared) |
| 029 | 実行結果の対象レコードが追加されること（前提=二段階認証が必要） | bound | C-041 |
| 030 | 管理ログイン画面への遷移を経てCookieとサーバ側情報により認証状態を再確立すること | bound | C-060 (shared) |
| 031 | 更新内容の対象レコードの値が変更されること | bound | C-022 |
| 032 | 値が変更され**ない**こと | bound | C-036 (shared・login_date不変) |
| 033 | 値が変更されること（前提=最終ログイン日時） | bound | C-022 (shared) |
| 034 | 本機能はバッチを起動しないこと | **TBD**（L1-036） | —（隣接可観測claimはL1-037=補完C-023で担保） |
| 035 | 値が変更されること | bound | C-022 (shared) |
| 036 | 値が変更されること（入力=最大長） | bound | C-022,C-037 (shared) |
| 037 | 値が変更され**ない**こと（入力=最大長+1） | bound | C-036,C-038 (shared) |
| 038 | 値が変更されること（入力=最小長） | bound | C-022,C-039 (shared) |
| 039 | 値が変更され**ない**こと（入力=最小長-1） | bound | C-036,C-031 (shared) |
| 040 | 値が変更されること | bound | C-022 (shared) |
| 041 | 実行結果の対象レコードの値が変更されること | bound | C-022 (shared) |
| 042 | 未認証もしくは追加認証未完了では利用できない管理側の機能であること | bound | C-001,C-042,C-045 (shared) |
| 043 | 二段階認証など追加の本人確認であること | bound | C-040 (shared) |
| 044 | Cookieとサーバ側保存情報で再確立する仕組みであること | bound | C-060 (shared) |
| 045 | 一時的にログイン送信を拒否/遅延させる制御であること | bound | C-050,C-052 (shared) |
| 046 | 未ログイン時にログインID・パスワード入力画面を表示すること | bound | C-010 (shared) |
| 047 | ログインID、パスワード、なりすまし対策トークン、送信ボタン、認証エラー/制限状態メッセージを表示すること | bound | C-011（可視部品＋hidden _csrf_token）,C-030（エラーメッセージ表示側） (shared) |
| 048 | ログイン可否はサーバ側の認証基盤で判定すること | bound | C-012 |
| 049 | ログイン/ログアウト/自動ログアウト/Remember Me再確立とも専用モーダル・確認ダイアログを表示しないこと | bound | **4状態被覆（改訂1）**: C-013（ログイン）,C-061（ログアウト）,C-060（Remember Me再確立）,C-062（自動ログアウト・実行保留） (shared) |
| 050 | 未ログインでログイン画面を表示したときであること（=titleの表示条件） | bound | C-015(+EN) |
| 051 | ログイン画面を表示したときであること（=プレースホルダの表示条件） | bound | C-016(+EN) |
| 052 | 画面表示データでエラーが表示されず継続できること（前提=著作権） | bound | C-017 |
| 053 | 成功メッセージなしであること | bound | C-020 (shared・成功時メッセージなし＋ホーム遷移=md:201) |
| 054 | 画面表示データでエラーが表示されず継続できること（前提=2FA成功） | bound | C-040 (shared・エラー欄に出さず追加認証へ=L1-027) |
| 055 | ログイン可能な状態の管理メンバーだけを認証対象とすること | bound | C-020,C-033,C-043 (shared) |
| 056 | 存在有無・停止・ログイン不可・不一致を画面上で詳細に区別しないこと | bound | C-030,C-033,C-035 (shared・全て同一2行=L1-016) |
| 057 | 管理セッションを確立しログイン履歴と最終ログイン日時の更新対象にすること | bound | C-020,C-021,C-022 (shared) |
| 058 | 固定窓方式でID+IP/IP単体を単位に送信回数を制御すること | bound | C-050,C-051 (shared) |
| 059 | 認証照合用の送信値であること | bound | C-018 |

`func_scope_check` 判定: 親59/59会計済み・欠落0・理由なし重複0・補完6行は§4.2に実体掲載
（親空・設計書補完・母集合会計外）→ **差分0を本文内で実証可能**。O6は主張しない。

## §9 TBD・要実機・excluded（正直な分離）

| # | 事項 | 状態 |
|---|---|---|
| 1 | 034 バッチ不起動 | **TBD**=L1-M0101-036（universal negative・不起動の観測契約が定義不能。隣接可観測分はL1-037→補完C-023） |
| 2 | 試行制限の-EN文言 | **en未確定**（validators.en.yamlに該当キーなし・fallback挙動は要実機=§5。-EN行を作らない=捏造回避） |
| 3 | `#password` セレクタ | twigにid明示なし（login.twig:29はrender由来）。既存page（login.page.ts:6）で**実機確認済み**の注記あり=候補では実機確認済み扱い・実装waveで再確認 |
| 4 | HTML5 requiredのブラウザ既定文言 | SUT外（ブラウザ実装依存）＝期待にしない（C-031はvalueMissing真偽で判定） |
| 5 | **試行制限の実効値とRedis状態生成** | 要実機・環境整備: ①実効limitが環境で上書きされている（prod E2E override=**1000**〔prod/eccube_e2e_login_throttling.yaml:1-5。「削除して cache:clear すれば既定(5)に戻る」と同ファイルに明記〕・dev=30〔dev/eccube.yaml:2〕）→C-050/051/052は**基準値5へ戻した隔離環境**でのみ実行可能 ②Redisリミッタ状態の初期化/生成ハーネス未実装（既存実績E2E-M01-01-030×の失敗理由と同根・SEED-M01-LOCK.sqlの冒頭注記） ③IP固定（判定単位にIPを含むため） |
| 6 | 2FA全体有効化 | `eccube_2fa_enabled`=env `ECCUBE_2FA_ENABLED`（eccube.yaml:252）の実効値は要実機（C-040/041/042の前提。無効環境ではskip） |
| 7 | 自動ログアウト（C-062）・分数なし制限文言（C-066） | **実行保留**（時間依存・設定依存/再現不安定。文言・遷移の期待値は確定済み） |
| 8 | **BC-DRAFT-m01-01-1（不具合候補・要確認）** | `enterprise.temp_post_member_login_action_required` フラグは**処理後に削除されない**（設計md:435に「処理後にこのフラグを削除しない」と明記・LoginHistoryListener.php:55-93 / SecurityListener.php:47 にもremove処理なし=grep実測）。コード上、**ログイン後の管理画面リクエストごとに成功履歴INSERT＋login_date更新が反復される**抑止条件が見当たらない。実挙動（重複登録の有無）は要実機確認。**影響行の正規列挙（改訂1・codex指摘）**: ①**C-021**（成功履歴の件数期待を count >= 1 に緩和） ②**C-041**（同・2FA経路。追加認証画面リクエストも管理画面リクエスト=INSERT契機） ③**C-061**（ログアウトGETは `admin_login` URI除外に該当せず〔LoginHistoryListener.php:66-67〕、フラグ残存時は**ログアウト自体が成功区分INSERT契機**になりうる→「履歴非保存」〔設計md:410=L1-030〕の判定は失敗区分/ログアウト区分行の不在に限定し、成功区分行の有無はBC確認結果に従う）。乖離観測時は本BC-DRAFTへ確認情報（×確定/却下）を記録 |
| 9 | セッションCookie name/lifetime・secure実効値 | env値（ECCUBE_COOKIE_NAME等）＝実値固定しない（C-063はhttpOnly=trueのみ判定） |
| 10 | 管理画面のenロケール切替口 | 要D15（-EN 6行の実行前提。W0実測を継承） |
| 11 | manifest_sha1（fixture_version確定） | D5後（現状 `@TBD-D5`。SEED-M01系SQLは実装済みだがfixture_version契約は未確定） |
| excluded | —（0件） | 本機能はexcluded 0。生成器の汎用行がすべて実在の認証副作用に対応（§8極性注記。偽陰性ゼロ=実在ケースの除外なし） |

候補規律: 全行 `@TBD-D5`・O5未確定（D6後に確定検査）・実装/実走なし・O6/聖域/多軸/C6C7を主張しない。

## §10 C4-manual証跡（極性反転・機械検出不能の限定つき手動レビュー）

対象構文の列挙とclaim別判定（認証機能は「エラーが表示され完了しない/表示されず継続」の対と
「追加される/されない」「変更される/されない」の対が多数）:

| 対象 | 極性判定 | 判定根拠（一次資料） |
|---|---|---|
| 009（必須エラーあり）vs 010（必須エラーなし） | 009=未入力（HTML5層ブロック=C-031＋サーバ層2行=C-032）／010=両欄入力済で必須エラーなし継続（C-020） | LoginType.php:43-54（NotBlank実在）／FormLoginAuthenticator.php:131,141／m01-01md:145,195 |
| 012/015（相関エラーあり）vs 013/014（相関エラーなし） | エラーあり=PW不一致・停止中（C-030/C-033）／エラーなし=正組合せで継続（C-020）。**excludedにしない**（認証照合=相関検証が実在） | m01-01md:143-152判定順序／security.yaml:13-16／MemberProvider.php:76-95 |
| 016（DB相関エラーなし）vs 017（DB相関エラーあり） | エラーなし=DB照合成功（C-020）／エラーあり=不存在ID（C-035） | MemberProvider.php:92-95／AuthenticatorManager.php:263-266 |
| 019〜028の「追加される/されない」 | 肯定→成功/失敗履歴の追加（C-021/C-035/C-037/C-039）／否定→020=成功区分行なし（C-036）・025=51字切詰で記録不発生（C-038）・027=0字送信ブロック（C-031）。**「追加されない」を「失敗履歴も出ない」と誤読しない**（失敗時も失敗区分行は追加される=L1-020。否定は成功区分行・超過値行・リクエスト不発生に限定） | LoginHistoryListener.php:55-141／LoginType.php:41,50（maxlength）／m01-01md:306-308 |
| 031〜041の「変更される/されない」 | 肯定→login_date更新（C-022）／否定→失敗時login_date不変（C-036）。onAuthenticationFailureにlogin_date更新なし=関数全文でdtb_member非対象 | LoginHistoryListener.php:88-91,95-141／m01-01md:308 |
| 018「なしであること」 | 「なし」=ログイン済みでログインURLを開いたときの表示メッセージ（md:203の表の値）＝否定期待だが遷移（ホームへリダイレクト）とセットで観測可能→C-014（TBDにしない） | m01-01md:203,240 |
| 034「バッチを起動しないこと」 | universal negative・観測契約なし→**TBD**（excludedにしない=実在仕様の除外禁止。隣接可観測のmd:263後段はL1-037=補完C-023で肯定側から担保） | m01-01md:263 |
| 053「成功メッセージなし」・027(L1-027)「エラー欄に出さない」 | 否定期待だが観測範囲がログイン画面DOM/遷移に限定されており観測可能→bound（C-020/C-040） | m01-01md:201,202 |
| 049「4状態ともモーダル表示しない」（改訂1是正） | 否定期待×4状態の列挙。**C-013単独bindは被覆不足**（codex R1検出）→ログイン=C-013／ログアウト=C-061／Remember Me再確立=C-060／自動ログアウト=C-062（実行保留）の4行で状態列挙を被覆（L1-033の観測範囲を4状態へ拡張） | m01-01md:106 |

codex敵対レビュー: **R1=要修正（Major2＋Minor1・Blockerなし。excluded=0・捏造ゼロは妥当確認済み）→改訂1で全数是正**。
R1検出の記録（C4-manual実効性証跡）: ①IT-049のC-013単独bind=4状態被覆不足（極性でなく**列挙の被覆漏れ**の検出例）
②BC-DRAFT-m01-01-1のC-061への波及未接続 ③C-041件数期待の不統一。→上表と§8・§9-8へ反映済み。**R2再確認待ち**。
判定確定後に `REVIEW_LEDGER.md` と同期する。

---

## 付録: 作業実測（B0係数計測用）

- 読んだ一次資料・参照物: 設計書md 1／ee実ソース・設定 20超（AdminController・LoginType・login.twig・
  login_frame.twig・security.yaml・framework.yaml・eccube.yaml×4（dev/prod含む）・services.yaml・routes.yaml・
  MemberProvider・Work・LoginHistoryListener・LoginHistoryStatus・SecurityListener・TwoFactorAuthListener・
  TwoFactorAuthService・TwoFactorAuthController・AdminAutoLogoutListener・EnterpriseEccubeRememberMeRedirectListener・
  EccubeAuthenticationSuccess/FailureHandler・EccubeRoleConnection・Constant・Member・EccubeExtension）／
  vendor 5（FormLoginAuthenticator・AuthenticatorManager・DefaultLoginRateLimiter・LoginThrottlingListener・
  TooManyLoginAttempts/BadCredentials/InvalidCsrfToken例外）／locale 4＋vendor xlf照合／
  母集合・台帳 2／統治・見本 4／既存実装 4（spec・page×2・SEED SQL×6）。
- L1 claim数: **38確定＋1 TBD**（=39行）。候補ケース行45（ja39・-EN6）。
- 認証系特有の難所: (1) 期待メッセージの解決経路が**Form層でなく認証基盤の例外→validatorsドメインtrans**
  （messageKey→yaml上書き）で、Form機能（NotBlankフィールドエラー）が**出ない**ことまでが仕様
  (2) 試行制限は**設定が環境で3層上書き**（既定5/dev30/prod-E2E1000）され「5回/30分」が実行環境で観測
  できない構造＝環境復元を前提化 (3) 「追加されない」系の極性が**失敗履歴は追加される**事実と衝突
  しやすい（否定の対象を成功区分行・超過値・リクエスト不発生に精密化） (4) 成功履歴の登録契機が
  ログインPOSTでなく**ログイン後リクエスト＋セッションフラグ**で、フラグ非削除（設計に明記）により
  厳密件数が断定不能→BC-DRAFT起票。

/* 記入例: https://joolen.backlog.com/view/ECCUBE_HARERUYA-1618 */

# 基本情報【必須】
分類：API店頭買取管理
機能：買取アプリ用ログイン
課題カテゴリ：実装違い
課題：買取アプリ用ログインが管理画面ログインへCookie付き中継せず、login_member_viewの直接認証に置き換わっている
設計書：0506_基本設計仕様書(API_店頭買取管理).xlsx

# 再現手順【必須】
1. POST http://localhost:8080/api/v1/admin/login.json に login_id と password をフォーム値で送信する
2. ec-cube-enterprise の LoginController で /admin/login へのGET、login_check へのPOST、一時Cookieファイルの作成削除が行われるか確認する
3. pf-api の同機能実装と比較し、管理ログインへのHTTP中継ではなく login_member_view と UserPasswordHasherInterface による直接認証になっていることを確認する

# 期待される挙動【必須】
- 買取アプリ用ログインは、受け取ったログインIDとパスワードをEC-CUBE管理画面の買取アプリ用ログインへ中継して認証する
- 中継前に管理画面の /admin/login へアクセスし、セッション確立用CookieをログインID別の一時ファイルに保存する
- 保存したCookieを送信しながら login_check にログインIDとパスワードをPOSTする
- 処理後に一時Cookieファイルを削除する
- 認証成功時は中継先が返した会員情報とJWTトークンのJSONを返し、認証失敗時は中継先応答のエラー文言をもとにHTTP 401を返す

# 現在の挙動【必須】
- ec-cube-enterprise では、買取アプリ用ログインAPIが `/%eccube_api_v1_route%/admin/login.json` として実装されている。Controller は `login_id` と `password` を読み、`login_member_view` を `LoginMemberViewRepository` で検索し、`Member` を組み立てて `UserPasswordHasherInterface::isPasswordValid()` で直接パスワード検証する。`/admin/login` へのGET、login_check へのPOST、`/tmp/login{$loginId}.cookie` の作成削除はこの実装にない。

ec-cube-enterprise Controller は LoginMemberViewRepository と passwordHasher を注入する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:31-37`
```php
class LoginController extends AbstractController
{
    public function __construct(
        private readonly LoginMemberViewRepository $loginMemberViewRepository,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly JwtTokenService $jwtTokenService,
    ) {
```

ec-cube-enterprise Controller は login_id/password を読み login_member_view を直接検索する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:45-58`
```php
    #[Route('/%eccube_api_v1_route%/admin/login.json', name: 'api_admin_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        $loginId = (string) $request->request->get('login_id', '');
        $password = (string) $request->request->get('password', '');

        if ($loginId === '' || $password === '') {
            throw new UnauthenticatedException('ログインIDまたはパスワードが入力されていません');
        }

        $viewMember = $this->loginMemberViewRepository->findOneBy(['login_id' => $loginId, 'work_id' => Work::ACTIVE]);

        if ($viewMember === null) {
            throw new UnauthenticatedException('ログインIDまたはパスワードが正しくありません');
```

ec-cube-enterprise Controller は Member を組み立てて passwordHasher で直接認証する: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:61-70`
```php
        // MemberProvider と同じパターンで Member オブジェクトを構築してパスワード検証
        $member = new Member();
        $member->setId($viewMember->getId());
        $member->setLoginId($viewMember->getLoginId());
        $member->setPassword($viewMember->getPassword());
        $member->setSalt($viewMember->getSalt());
        $member->setBaseInfo($this->entityManager->find(BaseInfo::class, $viewMember->getBaseInfoId()));

        if (!$this->passwordHasher->isPasswordValid($member, $password)) {
            throw new UnauthenticatedException('ログインIDまたはパスワードが正しくありません');
```
- ベース実装(pf-api)では、`admin_login_url` の既定値として `/admin/login`、`admin_login_check_url` の既定値として `/admin/login_check` を用意し、ログインID別の `/tmp/login{$loginId}.cookie` を作成する。`/admin/login` へのGETで `CURLOPT_COOKIEJAR` にCookieを保存し、login_check へのPOSTで `CURLOPT_COOKIEFILE` から保存Cookieを送信し、処理後に `unlink($cookieFile)` で削除する。

ベース実装 pf-api は /admin/login と login_check のURL、ログインID別Cookieファイルを用意する: `pf-api/src/Controller/Admin/LoginController.php:16-21`
```php
    public function postAction(Request $request)
    {
        $loginCheckUrl = $this->container->getParameter('admin_login_check_url') ?? ('http://' . filter_input(INPUT_SERVER, 'HTTP_HOST') . '/admin/login_check');
        $loginUrl = $this->container->getParameter('admin_login_url') ?? ('http://' . filter_input(INPUT_SERVER, 'HTTP_HOST') . '/admin/login');
        $loginId = $request->get('login_id');
        $cookieFile = "/tmp/login{$loginId}.cookie";
```

ベース実装 pf-api は /admin/login にGETしてCookieを一時ファイルへ保存する: `pf-api/src/Controller/Admin/LoginController.php:23-35`
```php
        // Get cookie
        $ch = curl_init();
        $options = [
            CURLOPT_URL => $loginUrl,
            CURLOPT_CUSTOMREQUEST => 'GET',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => true,
            CURLOPT_COOKIEJAR => $cookieFile,
        ];
        curl_setopt_array($ch, $options);

        $response = curl_exec($ch);
        curl_close($ch);
```

ベース実装 pf-api は保存Cookieを使って login_check へPOSTし、Cookieファイルを削除する: `pf-api/src/Controller/Admin/LoginController.php:37-56`
```php
        // Login check
        $chCheck = curl_init();
        $requestData = [
            'login_id' => $loginId,
            'password' => $request->get('password'),
        ];
        $fields = http_build_query($requestData);

        $options = [
            CURLOPT_URL => $loginCheckUrl,
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_COOKIEFILE => $cookieFile,
            CURLOPT_POSTFIELDS => $fields,
        ];
        curl_setopt_array($chCheck, $options);
        $response = curl_exec($chCheck);
        curl_close($chCheck);
        unlink($cookieFile);
```

# 根拠
- 設計：
  - 基本設計は現行踏襲、/admin/login Cookie取得、login_check呼び出し、/tmp/login{$loginId}.cookie 保存を要求する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:887-899`
  - 詳細設計は pf-api のログイン中継処理を正とする: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:962-965`
  - 処理フローはCookie一時ファイル、login_check送信、削除を要求する: `hareruya-design-docs/excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html:991-993`
- ec-cube-enterprise：
  - Controller は login_member_view と passwordHasher による直接認証: `ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:45-70`
  - login_member_view の読み取りRepository: `ec-cube-enterprise/src/Eccube/Repository/Views/LoginMemberViewRepository.php:22-39`
  - LoginMemberView は login_member_view を参照する: `ec-cube-enterprise/src/Eccube/Entity/Views/LoginMemberView.php:21-64`
- ベース実装：
  - pf-api は CookieJAR/CookieFILE による管理ログイン中継を行う: `pf-api/src/Controller/Admin/LoginController.php:16-56`
  - pf-api は /admin/login.json と /admin/login を同一処理へ向ける: `pf-api/config/routes.yaml:1-8`

# 確認メモ
- 確認コマンド: `nl -ba excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html | sed -n '887,1020p'`
- 確認コマンド: `nl -ba pf-api/src/Controller/Admin/LoginController.php | sed -n '16,72p'`
- 確認コマンド: `nl -ba pf-api/config/routes.yaml | sed -n '1,8p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php | sed -n '31,75p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Repository/Views/LoginMemberViewRepository.php | sed -n '1,80p'`
- 確認コマンド: `nl -ba ec-cube-enterprise/src/Eccube/Entity/Views/LoginMemberView.php | sed -n '1,130p'`
- 確認コマンド: `rg -n "admin_api/login_check|admin/login_check|admin_login_check_url|admin_login_url|COOKIEJAR|COOKIEFILE|cookieFile|/tmp/login|login\\{\\$loginId\\}\\.cookie|HttpClient|curl_init|Guzzle" ec-cube-enterprise/src ec-cube-enterprise/app/config ec-cube-enterprise/tests`
- 確認コマンド: `rg -n "api_admin_login|admin/login.json|/%eccube_api_v1_route%/admin/login.json|/admin/login" ec-cube-enterprise/src ec-cube-enterprise/app/config`
- 確認コマンド: `rg -n "login_member_view|LoginMemberView|isPasswordValid|createToken" ec-cube-enterprise/src ec-cube-enterprise/tests`
- gpt-5.5 high の批判的レビューでは、設計が現行踏襲かつ pf-api/pf-eccube3 を正典としており、Cookie取得・保存・login_check中継・削除まで明記されているため VERIFIED と判定された。
- 設計HTMLは /admin_api/login_check と記載し、pf-api 実装のフォールバックは /admin/login_check で、実際の中継先は admin_login_check_url 環境値に依存する。そのため本項目では、パス文字列単体ではなく、管理ログインへのHTTP中継とCookieファイル管理が直接認証へ置換されている点を差分として扱う。
- A06-01 のルート差分、未入力検証、401レスポンス形、JWT iss/aud、店舗なし時空文字は別候補として扱う。未入力検証と401レスポンス形は本項目の派生差分として関連付け可能。

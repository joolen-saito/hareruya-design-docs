■API-A06-01 買取アプリ用ログイン
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取アプリ用ログインの入口は、設計HTML上は POST /api/admin/login.json（基本設計）および POST /admin/login.json / POST /admin/login（詳細設計）として呼び出せること。
　実装のルートは /%eccube_api_v1_route%/admin/login.json で、既定値は api/v1 のため実URLは POST /api/v1/admin/login.json。member login user routes も /api/v1/admin/login.json のみを許可している。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-3:887-889,983-985 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:45, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:6, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:286）

■API-A06-01 買取アプリ用ログイン
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本店管理画面の /admin/login でCookieを取得し、/admin_api/login_check へログインID・パスワードと保存済みCookieを送信し、ログインID別の /tmp/login{$loginId}.cookie を作成・削除すること。
　実装はリクエストの login_id/password を読み、login_member_view を findOneBy して UserPasswordHasherInterface で直接パスワード検証している。/admin/login へのアクセス、/admin_api/login_check への中継、一時Cookieファイル作成・削除は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-3:894-899,987-993,1015-1016,1042-1043 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:48-70, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/Views/LoginMemberViewRepository.php, 不在（探索範囲: src/Eccube, app/config; 検索語: tmp/login, login{$loginId}, .cookie, Cookie, login_check, admin_api/login_check, /admin/login））

■API-A06-01 買取アプリ用ログイン
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）pf-api側では login_id/password の形式・必須検証を行わず、中継先の認証判定に委ね、未入力・誤りは認証拒否（HTTP 401）として扱うこと。
　実装は login_id と password を取得した直後、空文字の場合に 'ログインIDまたはパスワードが入力されていません' の UnauthenticatedException を投げている。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-3:999-1000,1019-1020 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:48-53）

■API-A06-01 買取アプリ用ログイン
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）認証失敗時は応答からエラー文言を抽出し、HTTP 401で {code, message} のJSONを返す。message は中継先の画面エラー文言から改行表記を除いたもので、pf-api独自の文言は設けないこと。
　実装は UnauthenticatedException に独自文言を設定し、API例外ハンドラが {'code': 401, 'errors': [...]} を返す。message フィールドではなく errors 配列で、文言も中継先画面から抽出していない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-3:917-918,1004-1005,1035-1036 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:51-58, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/UnauthenticatedException.php:27-34, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:80-83, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136-139）

■API-A06-01 買取アプリ用ログイン
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）JWTトークンのペイロードは発行者と利用者ID（管理者会員のID）を持ち、サンプルでも iss と aud を含むこと。署名方式はHS256。
　実装の createToken はペイロードを {'sub': (string) memberId} のみで生成し、HS256で署名している。iss と aud は設定していない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-3:947-948,987-988,1001-1003,1022-1023 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Security/AccessToken/JwtTokenService.php:79-87）

■API-A06-01 買取アプリ用ログイン
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員に店舗が紐づかない場合、shopName と shopAddr は空文字で返すこと。
　LoginMemberView の base_info_id は nullable だが、LoginController は find(BaseInfo::class, getBaseInfoId()) の結果を Member::setBaseInfo(BaseInfo $baseInfo) に渡す。Member::getBaseInfo は非nullable BaseInfo を返し、その後 getAddr01/getAddr02/getShopName を呼ぶ。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-3:1001-1003,1022-1023 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Views/LoginMemberView.php:63-64, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Member.php:188-205, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/LoginController.php:67-85）

■API-A06-02 店頭買取情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）エンドポイントURLは /api/admin/otcBuyOrders.json。詳細設計では GET /admin/otcBuyOrders.json と拡張子なし別名 GET /admin/otcBuyOrders も同一処理として扱う。
　実装ルートは /%eccube_api_v1_route%/admin/otcBuyOrders.json のみで、既定値は api/v1 のため /api/v1/admin/otcBuyOrders.json になる。/api/admin/otcBuyOrders.json および拡張子なし /admin/otcBuyOrders のルートは見つからない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-4:1077 / :1078 / :1175 / :1176 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:69, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:6, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube.yaml:55）

■API-A06-02 店頭買取情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店頭買取ステータスが商品到着（5）・査定中（6）・振込前（7）・保留（8）・査定再開（9）のいずれかの店頭買取受注を抽出する。
　実装は ASSESSMENT_UNCOMPLETED_STATUSES として 5,6,8,9 のみを渡しており、設計にある 7 を含めていない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-4:1185 / :1188 / :1239 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:84, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:85, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:86, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:87, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:88, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:79）

■API-A06-02 店頭買取情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）認証した管理者会員に店舗が紐づく場合はその店舗の受注に絞り込み、紐づかない場合は店舗による絞り込みを行わず査定対象の受注を一律に返す。
　Controller は常に $Member->getBaseInfo()->getId() を shopId として取得し、Repository は int $shopId 必須で baseInfo.id = :shopId を常に付与する。店舗なしの場合に絞り込みなしで取得する分岐はない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-4:1180 / :1185 / :1249 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:77, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1011, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1015, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1061, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Member.php:188, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Member.php:189）

■API-A06-02 店頭買取情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）applyDate と customerInfo.birth は ISO8601形式の日時文字列として返す。
　applyDate は Y/m/d H:i:s、birth は Y-m-d で整形している。ISO8601形式ではない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-4:1194 / :1199 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:97, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:113）

■API-A06-02 店頭買取情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）identificationId は本人確認のIDを返し、未登録の場合は0を返す。
　本人確認は leftJoin され、identification.id を取得する。Controller は identificationId が無い場合 null を返す。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-4:1194 / :1243 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1025, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbOtcBuyOrderRepository.php:1055, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:106）

■API-A06-02 店頭買取情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）認証失敗時は HTTP 401 とし、本文を持たない。
　App API の例外処理は 401 の場合も JsonResponse で {"code":401,"errors":["認証エラー"]} を返す。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-4:1197 / :1249 / :1251 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:72, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:98, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:137, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:138, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:139）

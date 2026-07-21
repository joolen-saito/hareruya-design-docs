■API-A06-05 店頭買取情報ステータス更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）リクエストのステータスID（status）で店頭買取ステータスマスタを引く。該当が無い場合は入力不正（HTTP 400）とし「正しい店頭買取ステータスIDを入力してください」を返す。
　status が欠落・空・非数値の場合は「ステータスが不正です」、マスタ未存在の場合は「ステータスが見つかりません」を HTTP 400 で返す。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-7:1874,1887,1898,1915 ／ 実装: src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:198, src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:206, src/Eccube/Exception/App/InvalidParameterException.php:29）

■API-A06-05 店頭買取情報ステータス更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）更新前ステータスが査定中・査定再開で、かつ指定ステータスも査定中・査定再開で、その受注の査定担当者が認証した管理者会員と異なる場合は、入力不正（HTTP 400）とし「この受注は「（査定担当者名）」が査定中です。」を返す。
　他担当者が査定中の場合、HTTP 400 で「この受注は{担当者名}が査定中です」を返す。担当者名を囲む鉤括弧と末尾句点がない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-7:1874,1887,1898,1915 ／ 実装: src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:95, src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/UpdateStatusAction.php:101, src/Eccube/Exception/App/InvalidStatusTransitionException.php:29）

■API-A06-05 店頭買取情報ステータス更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）レスポンス（失敗）では、401 は「認証拒否（本文を持たない）」、404 は「該当なし（本文を持たない）」とする。
　App API の例外応答は 401/404 を含め JsonResponse で {code, errors} を返す。NotFoundException も BaseApiException として code/errors 形式になる。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-7:1886 ／ 実装: src/Eccube/EventListener/ExceptionListener.php:72, src/Eccube/EventListener/ExceptionListener.php:81, src/Eccube/EventListener/ExceptionListener.php:94, src/Eccube/EventListener/ExceptionListener.php:136）

■API-A06-05 店頭買取情報ステータス更新
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）利用者視点の入口として、PUT /admin/otcBuyOrder/{id}/status の拡張子なし別名も /status.json と同一処理で提供する。
　店頭買取ステータス更新の Route は /%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json のみ定義され、拡張子なし /status の同一処理ルートは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-7:1865 ／ 実装: 不在（探索範囲: src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php, app/config/eccube/routes.yaml, src/Eccube, html。検索語: otcBuyOrder/{id}/status, status.json, /status, api_admin_otc_buy_order_update_status））

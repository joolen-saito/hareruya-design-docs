■API-A17-03 PointGranterAPI連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）PointGranterから送られてきた端末販売APIの内容をスマレジ取引APIへ中継する。契約ID・アクセストークンを付与して、スマレジ顧客連携サービスへ処理名とパラメータを渡し、取引APIへ中継する。
　PointGranterController は SmaregiApiService::postRegisterTransaction() を呼ぶが、同メソッドは TODO コメント付きで固定の {'result': {'status': 'success'}} を返すだけで、スマレジ取引APIへのHTTP POST中継を行っていない。反証検索でも postRegisterTransaction/postTransactions/transaction_upd/point_granter の別実装は見つからず、SmaregiTransactionApiClient はGET取得・一覧のみだった。確認お願いします。（設計根拠: excel_to_html/output/0517_基本設計仕様書(API_その他).html#sheet-5:1700,1805,1823 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiApiService.php:35）

■API-A17-03 PointGranterAPI連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）下記の項目（X_contract_id、X_access_token、proc_name、params）がなければエラー404を返す。ステータスコード 404.0 は必須項目にデータがない場合。
　契約ID・アクセストークン・proc_name・params のいずれかが空の場合、JsonResponse([], HTTP_BAD_REQUEST) を返すためHTTP 400になる。確認お願いします。（設計根拠: excel_to_html/output/0517_基本設計仕様書(API_その他).html#sheet-5:1703,1740 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/PointGranterController.php:53）

■API-A17-03 PointGranterAPI連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員ポイント残高は dtb_customer.point とし、取引更新時にポイントを加算する。
　customerId から dtb_player.smaregi_id で DtbPlayer を検索し、DtbPlayer::setPoint($Player->getPoint() + $newPoint) で dtb_player.point を更新している。Customer::point は Entity に存在するが、この処理では更新されない。確認お願いします。（設計根拠: excel_to_html/output/0517_基本設計仕様書(API_その他).html#sheet-5:1770,1900 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:66）

■API-A17-03 PointGranterAPI連携
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ポイント履歴（dtb_point_history）は、会員（customer_id）・増減ポイント（point_change）・備考（note）・発行日（issue_date）・作成日（create_date）・ポイント種別（point_type_id）・スマレジ取引ID（transaction_id）を持ち、付与時に登録する。
　PointHistoryEntityManager::save() で customer_id、point_change、note、issue_date、point_type_id は設定されるが、transactionId は常に null が渡される。DtbPointHistory には transaction_id カラムと setter があるが、この処理ではスマレジ取引IDを保存しない。確認お願いします。（設計根拠: excel_to_html/output/0517_基本設計仕様書(API_その他).html#sheet-5:1770,1901 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/PointGranter/PointGranterAction.php:68）

■API-A07-04 ネット買取受注ステータス更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）失敗レスポンスで、トークン欠落・署名不正・該当する管理者会員なしはHTTP 401、受注IDに該当するネット買取受注が無い場合はHTTP 404とし、いずれも本文を持たない。
　App APIの例外は共通ExceptionListenerで必ずJSON本文 {code, errors} に変換される。UnauthenticatedExceptionは401、NotFoundExceptionは404だが、本文なしではない。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-6:1510 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:72）

■API-A07-04 ネット買取受注ステータス更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存処理中の例外は処理失敗（HTTP 500）とし、{code, errors} の errors に例外メッセージを返す。トランザクションはロールバックする。
　保存処理中の例外ではrollback後に InternalException('システムエラーが発生しました', $e) を投げ、Controller側の予期しない例外も同じ固定文言でラップする。ExceptionListenerはBaseApiExceptionのerrorsをそのまま返すため、errorsは元例外メッセージではなく「システムエラーが発生しました」になる。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-6:1510 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateStatusAction.php:111）

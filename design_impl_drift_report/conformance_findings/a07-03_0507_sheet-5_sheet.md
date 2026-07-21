■API-A07-03 ネット買取受注コメント更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存処理中の例外はHTTP 500とし、本文は {code, errors}（errors は例外メッセージ。トランザクションはロールバックする）を返す。
　保存処理中の例外時、UpdateFreeCommentAction は rollback 後に元例外メッセージではなく固定文言「システムエラーが発生しました」の RuntimeException を投げる。Controller も Throwable を固定文言の InternalException に包み直し、ExceptionListener はその固定文言を errors として返す。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-5:1326,1354 ／ 実装: src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateFreeCommentAction.php:41-44; src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:116-117; src/Eccube/Exception/App/InternalException.php:27-31; src/Eccube/EventListener/ExceptionListener.php:81-83,136-139）

■API-A06-03 店頭買取情報更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力検証エラーはHTTP 400で全メッセージを errors 配列に返し、401/404は本文を持たない。order_status は店頭買取ステータスマスタに存在するIDを受け付け、存在しない場合は指定メッセージを返す。
　DTO検証は #[MapRequestPayload] に委譲され、未指定のためSymfony既定の検証失敗ステータス422になる。App API例外は共通ExceptionListenerで常に {code, errors} JSONへ整形される。order_status はマスタ存在ではなく ASSESSMENT_COMPLETED_STATUSES への Choice 制約で絞られ、メッセージは 'order_status is invalid'。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-5:1524,1537,1556,1572 ／ 実装: src/Eccube/Controller/App/MTGBuyer/V1/Admin/OtcBuyOrderController.php:130 / src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:35 / src/Eccube/EventListener/ExceptionListener.php:81 / src/Eccube/EventListener/ExceptionListener.php:86 / src/Eccube/EventListener/ExceptionListener.php:136 / vendor/symfony/http-kernel/Attribute/MapRequestPayload.php:42）

■API-A06-03 店頭買取情報更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）order_details[].quantity と order_details[].price は任意の整数であり、サンプルでも個別入力商品の quantity/price は null を許容している。
　DTO上は quantity/price に NotNull はないが、BuildOtcBuyOrderDetailUpdatePlan が全明細に対して price === null または quantity === null を検出すると InvalidRequestParameterException('価格または数量が指定されていません') を投げる。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-5:1453,1454,1479,1531,1556 ／ 実装: src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDetailDto.php:35 / src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDetailDto.php:39 / src/Eccube/Service/App/MTGBuyer/V1/Admin/OtcBuyOrder/BuildOtcBuyOrderDetailUpdatePlan.php:51）

■API-A06-03 店頭買取情報更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）qualified_invoice_issuer_confirmation_flg は任意booleanで、受注が適格請求書発行事業者に該当する場合のみ確認済みフラグを指定値で更新する。
　UpdateOtcBuyOrderDto は nullable bool として受けるが、OtcBuyOrderEntityManager::update は if ($qualifiedInvoiceIssuerConfirmationFlg) の場合だけ setQualifiedInvoiceIssuerConfirmationFlg() を呼ぶ。受注が適格請求書発行事業者かどうかの条件判定もこの更新箇所にはない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-5:1524,1531,1552,1566 ／ 実装: src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateOtcBuyOrderDto.php:38 / src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:62 / src/Eccube/Entity/DtbOtcBuyOrder.php:696）

■API-A06-03 店頭買取情報更新
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受注更新時、指定ステータスが成立（1）の場合は成立日時を、それ以外の場合はキャンセル日時を現在日時に設定する。
　OtcBuyOrderEntityManager::update は isComplete() の場合に completeDate と transactionId を設定し、elseif isCancel() の場合だけ cancelDate を設定する。受け付け対象に含まれる経理払出し待ち（STATUS_ACCOUNTING_PAYMENT_PENDING=10）は complete/cancel どちらでもないため、キャンセル日時は設定されない。確認お願いします。（設計根拠: excel_to_html/output/0506_基本設計仕様書(API_店頭買取管理).html#sheet-5:1524,1552,1566 ／ 実装: src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:51 / src/Eccube/Service/EntityManager/OtcBuyOrderEntityManager.php:57 / src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:57 / src/Eccube/Entity/Master/MtbOtcBuyOrderStatus.php:91）

■API-A07-05 ネット買取注文の査定終了処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ステータス・明細の入力検証に1件以上失敗した場合、入力不正（HTTP 400）とし、code と errors のJSONを返す。
　updateBuyOrder は #[MapRequestPayload] を validationFailedStatusCode 未指定で使用しており、Symfony既定の HTTP 422 を使用する。ExceptionListener は HttpException の statusCode を尊重して code/errors を返す。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-7:1712 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:171; /home/y-saito/Developments/ec-cube-enterprise/vendor/symfony/http-kernel/Attribute/MapRequestPayload.php:42; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:86）

■API-A07-05 ネット買取注文の査定終了処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）order_status は必須。買取受注ステータスマスタに存在しないIDは「MtbBuyOrderStatusに（値）が見つかりません。」を返す。いずれも入力不正（HTTP 400）。
　指定された orderStatusId を MtbBuyOrderStatusRepository::find で検索し、存在しない場合は InvalidParameterException('正しい買取ステータスIDを入力してください') を投げる。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-7:1732 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:183）

■API-A07-05 ネット買取注文の査定終了処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）更新処理中の例外は、トランザクションをロールバックし、内部エラー（HTTP 500）とし、code と例外メッセージ配列 errors のJSONを返す。
　UpdateBuyOrderAction は例外時に rollback し error ログを出すが、レスポンス用には InternalException('システムエラーが発生しました', $e) に包み直す。ExceptionListener はその固定文言を errors として返す。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-7:1712 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/App/MTGBuyer/V1/Admin/BuyOrder/UpdateBuyOrderAction.php:130; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/InternalException.php:27; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136）

■API-A07-05 ネット買取注文の査定終了処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受注IDに該当するネット買取受注が無い場合は、該当なし（HTTP 404）とし、本文を持たない。
　対象受注が無い場合は NotFoundException('買取情報が見つかりません') を投げる。NotFoundException は BaseApiException として errors と 404 を持ち、ExceptionListener が {code, errors} のJSON本文を返す。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-7:1712 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:173; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Exception/App/NotFoundException.php:29; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/EventListener/ExceptionListener.php:136）

■API-A07-05 ネット買取注文の査定終了処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）明細の name は商品名。必須、最大65535。
　DTO は name を最大65535として検証する一方、product_class_id が 0 の個別入力商品を保存する DtbBuyOrderIndivisualInputProduct.name は ORM 上 length: 255 の string カラムである。確認お願いします。（設計根拠: excel_to_html/output/0507_基本設計仕様書(API_ネット買取管理).html#sheet-7:1624 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Dto/App/MTGBuyer/V1/Admin/UpdateBuyOrderDetailDto.php:32; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbBuyOrderIndivisualInputProduct.php:35）

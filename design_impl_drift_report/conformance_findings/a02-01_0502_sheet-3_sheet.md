■API-A02-01 ポップアップ用商品情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）言語区分は jp または en を想定し、EC-CUBEサーバURLでは jp で表記する。
　getPopupProductByProductId は strtolower($lang) の match で 'ja' => 'JP', 'en' => 'EN' のみを許可し、'jp' は default で NotFoundException になる。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-3:872,983 ／ 実装: src/Eccube/Controller/App/ProductController.php:158）

■API-A02-01 ポップアップ用商品情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取得できない場合はコード404・メッセージ「Not Found」のJSONを返す。失敗時本文は {code, message}（"Not Found"）。
　NotFoundException は errors: ['Not Found'] を保持し、BaseApiException catch は {'code': $e->getStatusCode(), 'errors': $e->getErrors()} を返す。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-3:976,988,1024 ／ 実装: src/Eccube/Controller/App/ProductController.php:177）

■API-A02-01 ポップアップ用商品情報取得
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）成功レスポンスの price01、price02、stock、weeklySold は string として返す。price01/price02/stock は Doctrine の decimal 値、weeklySold は SUM 結果のため数値文字列で返す。
　ProductRepository は price01、price02、stock、weeklySold を integer scalar として取得し、PopupResponseBuilder も stock と weeklySold を int にキャストして返す。確認お願いします。（設計根拠: excel_to_html/output/0502_基本設計仕様書(API_商品管理).html#sheet-3:986 ／ 実装: src/Eccube/Repository/ProductRepository.php:2081）

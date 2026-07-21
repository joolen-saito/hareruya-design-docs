■API-A05-04 スマレジ受信処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）Webhook受信APIは POST /smaregi/transaction、認証あり、認証方式はIP制限、リクエスト書式JSON、レスポンス書式なし（ステータスコードのみ）とする。
　WebhookController は AuthenticationService::verify() で任意ヘッダ上の共有シークレットを hash_equals で検証し、失敗時は401 JSONを返す。IPアドレス/許可IPによる制限処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-6:1541 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:52, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/AuthenticationService.php:33）

■API-A05-04 スマレジ受信処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）Webhook受信時に返すステータスコードは200で、レスポンスデータは空を返す。レスポンス書式はなし（ステータスコードのみ）。
　通常成功時は JsonResponse(['status'=>'ok'], 200)、重複時は JsonResponse(['status'=>'ok','message'=>'Event is duplicate'], 200)、Smaregi-Event-Id欠落時は400 JSONを返す。確認お願いします。（設計根拠: excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-6:1544, excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-6:1679 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:74, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:85, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Smaregi/WebhookController.php:107）

■API-A05-04 スマレジ受信処理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）取引情報取得APIは https://api.smaregi.dev/{contract_id}/pos/transactions/{transaction_id}?with_details=all&with_deposit_others=all&with_discounts=all&with_store=all&with_customer=all&with_store=all&with_staff を改行なしで要求する。
　固定クエリは with_details=all, with_payments=none, with_discounts=all, with_store=all, with_customer=all, with_staff=all。with_deposit_others は送信していない。確認お願いします。（設計根拠: excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-6:1689, excel_to_html/output/0505_基本設計仕様書(API_受注管理).html#sheet-6:1702 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Api/SmaregiTransactionApiClient.php:33）

■管理-M05-26 出荷実績インポート登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）admin_shipping_result_csv_upload … POST … /{admin_route}/order/shipping_result_csv/upload （送信されたCSVまたはTSVの検証・一括反映・成功時の付随処理へ進む。）
　POSTルート名 admin_shipping_result_csv_upload は存在するが、パスは /{admin_route}/order/shipping_result_csv/import。フォームも admin_shipping_result_csv_import のURLへPOSTしており、/shipping_result_csv/upload ではない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-24:7757 ／ 実装: src/Eccube/Controller/Admin/Order/OrderCsvController.php:263 / src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig:45）

■管理-M05-26 出荷実績インポート登録
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）配送情報の「出荷日」を登録する。
　対象受注の配送一覧を走査しているが、設定しているのは $shipping->setShippingCommitDate($shippingDate) のみ。Shipping::setShippingDate() はこのインポート経路では呼ばれていない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-24:7633 ／ 実装: src/Eccube/Service/Csv/OrderCsv.php:143）

■管理-M05-26 出荷実績インポート登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）出荷完了メールを送信する。
　出荷実績インポート経路ではMailServiceの注入もsendShippingNotifyMail呼び出しもない。別経路のOrderControllerやShippingControllerにはsendShippingNotifyMailがあるが、本機能からは呼ばれていない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-24:7636 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order/OrderCsvController.php, src/Eccube/Service/Csv/OrderCsv.php, src/Eccube/Service/Csv/AbstractCsvService.php, src/Eccube/Controller/Admin/Order 配下, MailService/sendShippingNotifyMail/notify_mail/出荷完了メール））

■管理-M05-26 出荷実績インポート登録
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）スマレジへ付与ポイントを送信する。
　出荷実績インポート経路ではPointService::gainPointsでローカル会員ポイントを加算するのみ。SmaregiCustomerServiceは注入されておらず、smaregiCustomerService->gainPoints() や postSmaregiPoint() は呼ばれない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-24:7637 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order/OrderCsvController.php, src/Eccube/Service/Csv/OrderCsv.php, src/Eccube/Service/PointService.php, src/Eccube/Service/Smaregi 配下, SmaregiCustomerService/postSmaregiPoint/smaregiCustomerService->gainPoints））

■管理-M05-06 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート未選択の一括手動メール入力画面では、件名・確認ボタンはテンプレート選択まで無効扱いにする。
　確認ボタンは id 未設定時に disabled になるが、件名欄は form_row(form.subject) で常に通常入力欄として描画され、FormType 側にも disabled/readonly 条件がない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-10:3446 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:80; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:159; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/OrderManualMailAllType.php:56）

■管理-M05-06 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）右カラムの表示用注文番号および受注メール本文内の注文番号表記は Order#getOrderNo() を用いる。
　OrderUtil::getOrderNumbers は order->getOrderNumber() を返し、createManualBody も 'orderNumber' に $Order->getOrderNumber() を渡している。Order エンティティには別フィールド order_no を返す getOrderNo() が存在する。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-10:3455; excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-10:3476 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Util/OrderUtil.php:37; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/MailController.php:464; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Order.php:887）

■管理-M05-06 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）送信ボタンを押下して確認ダイアログで OK なら送信を実行し、成功/失敗に応じてメッセージを表示する。
　manual_mail.js に送信前 confirm はあり、manualMailAll の complete 分岐は送信ループ後に admin.order.mail_send_complete の成功フラッシュを積む。一方、sendManualMailForBulk や mailer->send() の失敗を捕捉して失敗メッセージを表示する分岐はない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-10:3383; excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-10:3384 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order/MailController.php の manualMailAll complete分岐、src/Eccube/Service/MailService.php の sendManualMailForBulk、src/Eccube/Resource/template/admin/Order/manual_mail_all_confirm.twig、src/Eccube/Resource/locale/messages.ja.yaml の mail_send/error 系））

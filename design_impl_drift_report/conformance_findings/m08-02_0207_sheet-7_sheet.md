■管理-M08-02 メール一括送信完了
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「確認」ボタンは POST /{admin_route}/customer/mail_confirm で確認画面を表示し、「送信」ボタンは POST /{admin_route}/customer/mail_complete で送信後に完了画面へ遷移し、送信完了画面は GET /{admin_route}/customer/mail_complete で表示する。
　実装は POST /{admin_route}/customer/mail の admin_customer_mail 1ルートのみで、mode=confirm のとき mail_confirm.twig、mode=complete のとき送信後 mail_complete.twig を render する。POST /customer/mail_confirm、POST /customer/mail_complete、GET /customer/mail_complete の独立ルートは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-7:2057,2066,2068,2070 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:50,71,77,83,99 ／ 不在（探索範囲: src/Eccube, html; 検索語: customer/mail_confirm, customer/mail_complete, m08-02_admin_customer_customer_mail_all_confirm, m08-02_admin_customer_customer_mail_all_execute, m08-02_admin_customer_customer_mail_all_complete））

■管理-M08-02 メール一括送信完了
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信記録の正典は会員メール送信履歴 dtb_user_mail_history（customer_id・subject・mail_body・send_date・creator_id）とし、メール送信履歴を記録する。
　一括送信後の履歴作成は MailHistoryEntityManager->save() で Eccube\Entity\MailHistory を persist しており、保存先Entityは dtb_mail_history。DtbUserMailHistory は dtb_user_mail_history に対応するが deprecated コメント付きで、当処理から使用されていない。creator_id も当該 save() では設定されない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-7:2051,2088,2091,2104 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:94,95,96 ／ src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:39,41,43,44,55,67 ／ src/Eccube/Entity/MailHistory.php:25,53,56,66,70 ／ src/Eccube/Entity/DtbUserMailHistory.php:21,24）

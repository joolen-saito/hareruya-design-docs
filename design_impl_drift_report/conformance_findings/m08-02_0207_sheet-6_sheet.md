■管理-M08-02 メール一括送信確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）確認画面は POST /{admin_route}/customer/mail_confirm、送信は POST /{admin_route}/customer/mail_complete、送信完了画面は GET /{admin_route}/customer/mail_complete として入力→確認→送信→完了の多段フローを持つ。
　実装は POST /customer/mail（admin_customer_mail）1本のみで、mode=confirm のとき確認 Twig を render し、mode=complete のとき送信後に完了 Twig を render する。確認・送信・完了の独立ルート、および GET /customer/mail_complete は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-6:1902,1908,1917,1919,1921,1950 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:50,71,72,83,99 / src/Eccube/Resource/template/admin/Customer/mail_confirm.twig:33,99,104 / 不在（探索範囲: src/Eccube と html の Route/Twig/JS/locale を customer/mail_confirm, customer/mail_complete, admin_customer_mail_confirm, admin_customer_mail_complete, m08-02_admin_customer_customer_mail_all_* で検索））

■管理-M08-02 メール一括送信確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）配信対象者を会員IDの昇順で表示する。
　確認画面の配信対象者は CustomerRepository::findByIds() の結果をそのまま Twig の for で表示するが、findByIds() は WHERE IN のみで orderBy('c.id', 'ASC') 等の昇順指定を持たない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-6:1841 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:75 / src/Eccube/Repository/CustomerRepository.php:573,579,582 / src/Eccube/Resource/template/admin/Customer/mail_confirm.twig:85）

■管理-M08-02 メール一括送信確認
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信記録の正典は会員メール送信履歴 dtb_user_mail_history（customer_id・subject・mail_body・send_date・creator_id）とし、送信時にメール送信履歴を記録する。
　送信時は MailHistoryEntityManager::save() が Eccube\Entity\MailHistory を生成して persist し、MailHistory は dtb_mail_history にマップされている。dtb_user_mail_history の DtbUserMailHistory Entity は存在するが deprecated コメント付きで、当該保存処理では使用されない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-6:1889,1902,1937,1941,1944,1956 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:94,95,96 / src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:39,41,43,44,55,67 / src/Eccube/Entity/MailHistory.php:25,53,56,66,70 / src/Eccube/Entity/DtbUserMailHistory.php:21,24）

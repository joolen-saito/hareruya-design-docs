■管理-M08-02 メール一括送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）確認画面・送信実行・完了画面はそれぞれ POST /{admin_route}/customer/mail_confirm、POST /{admin_route}/customer/mail_complete、GET /{admin_route}/customer/mail_complete の独立エンドポイントで扱う。画面遷移は入力→確認→送信→完了の多段構成とする。
　実装は /customer/mail の admin_customer_mail POST 1ルートのみを定義し、mode=confirm/complete で確認画面・送信完了画面を分岐レンダリングしている。customer/mail_confirm、customer/mail_complete、m08-02_admin_customer_customer_mail_all_confirm、m08-02_admin_customer_customer_mail_all_execute、m08-02_admin_customer_customer_mail_all_complete のルート定義は不在。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-5:1746,1755-1760,1788 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:50,77,83,99; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_confirm.twig:33）

■管理-M08-02 メール一括送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信記録の正典は会員メール送信履歴 dtb_user_mail_history（customer_id・subject・mail_body・send_date・creator_id）とし、メール送信履歴の記録に使用する。
　一括メール送信後の履歴保存は MailHistoryEntityManager::save() を呼び、new MailHistory() を persist している。MailHistory は #[ORM\Table(name: 'dtb_mail_history')] であり、dtb_user_mail_history ではない。DtbUserMailHistory エンティティは存在するが @deprecated コメント付きで、当該送信処理から参照・生成されていない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-5:1740,1775,1779,1782,1794 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:94-96; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:39-44,67; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php:25,53-57,70-72; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbUserMailHistory.php:21-25）

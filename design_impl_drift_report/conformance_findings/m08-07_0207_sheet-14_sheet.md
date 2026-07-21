■管理-M08-07 メール配信履歴
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）メール配信履歴は処理日降順で表示する。送信履歴を新しい順に表示する。
　MailHistoryRepository::findBy($criteria, ['id' => 'DESC']) で履歴を取得しており、処理日/send_date 降順ではなく id 降順である。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-14:3370,3453,3456 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:135）

■管理-M08-07 メール配信履歴
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）メール送信履歴を表示する（GET /{admin_route}/customer/{id}/mail_history）。会員詳細等の「メール送信履歴」は当該URLで表示する。
　実装ルートは #[Route(path: '/%eccube_admin_route%/customer/mail/{id}/history', name: 'admin_customer_mail_history', methods: ['GET'])] で、設計URL /customer/{id}/mail_history と異なる。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-14:3445,3452 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:116）

■管理-M08-07 メール配信履歴
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員へ配信したメールの送信履歴は ec-cube-enterprise の dtb_user_mail_history を正とし、customer_id、template_id、subject、mail_body、send_date を一覧表示・絞り込みに使用する。
　一覧は MailHistoryRepository で dtb_mail_history を参照し、件名列も subject ではなく mail_subject を表示する。DtbUserMailHistory は dtb_user_mail_history にマッピングされているが、コメントで deprecated・使用しないとされ、当画面の検索には使われていない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-14:3438,3439,3470,3473 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/MailHistory.php:25,53,70,232 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:27,135 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbUserMailHistory.php:21,24）

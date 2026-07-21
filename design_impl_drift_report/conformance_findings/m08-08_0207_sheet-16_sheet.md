■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）確認画面の「会員編集画面へ戻る」ボタンは、当該の会員情報編集画面へ遷移する。
　確認画面の戻りリンクは id="back" で mode=back をPOSTし、文言も「手動メール通知」。Controller は confirm/complete 以外の back 分岐を持たず、最終的に手動メール作成画面を再表示する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3724 ／ 実装: src/Eccube/Resource/template/admin/Customer/mail_manual_confirm.twig:91, src/Eccube/Controller/Admin/Customer/CustomerMailController.php:183, src/Eccube/Controller/Admin/Customer/CustomerMailController.php:210）

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート未選択で表示する場合、件名・本文の入力欄は出さず、本文textareaはテンプレート選択時のみ表示する。
　Controller は MailTemplate がある場合だけ件名・本文の値をセットするが、Twig は MailTemplate の有無に関係なく form.mail_subject と form.body(rows=20) を常に描画する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3797 ／ 実装: src/Eccube/Resource/template/admin/Customer/mail_manual.twig:71, src/Eccube/Resource/template/admin/Customer/mail_manual.twig:85, src/Eccube/Controller/Admin/Customer/CustomerMailController.php:165）

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレートID指定時は、会員向けベース（会員・会員英語・ベースなし）のテンプレートのみ対象とし、該当しないテンプレートIDは404にする。
　Route の template_id は任意の MailTemplate に MapEntity され、Controller は取得した MailTemplate の file_name を renderView して件名・本文をセットする。FormType の選択肢 query_builder は対象ベースに絞るが、直接URLで渡された base外テンプレートを404にするController側判定はない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3788 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:150, src/Eccube/Controller/Admin/Customer/CustomerMailController.php:165, src/Eccube/Form/Type/Admin/CustomerManualMailType.php:44）

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信する件名と本文は、確認・入力した送信内容を用いる。
　sendCustomerManualMail は Email subject を '[' . shopName . '] ' . formData['mail_subject'] にして送信し、MailHistoryEntityManager はその message subject を履歴へ保存する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3790 ／ 実装: src/Eccube/Service/MailService.php:1028, src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:40）

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目のフォームキーは template、mail[subject]、mail_body、隠し入力 mail[header]・mail[footer] とし、ヘッダ・フッタを送信に含める。
　フォーム prefix は admin_customer_manual_mail、フィールドは mailTemplate / mail_subject / body。確認画面は mailTemplate / mail_subject / body の hidden を出すが、header/footer の hidden 項目は存在しない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3796 ／ 実装: src/Eccube/Form/Type/Admin/CustomerManualMailType.php:43, src/Eccube/Form/Type/Admin/CustomerManualMailType.php:95, src/Eccube/Resource/template/admin/Customer/mail_manual_confirm.twig:62, 不在（探索範囲: src/Eccube/Form/Type/Admin/CustomerManualMailType.php, src/Eccube/Resource/template/admin/Customer/mail_manual*.twig; 検索語: mail[header], mail[footer], form.header, form.footer））

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）会員を指定して手動メールを開く入口として、GET /{admin_route}/customer/manual_mail（クエリで会員ID指定）を提供する。
　実装ルートは /customer/manual_mail/{id}/{template_id} の admin_customer_manual_mail のみ。会員一覧・編集画面のリンクも id をパスに含める。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3779 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerMailController.php:150, 不在（探索範囲: src/Eccube/Controller/Admin/Customer, src/Eccube/Resource/template/admin/Customer; 検索語: customer/manual_mail, admin_customer_manual_mail_edit, m08-08_admin_customer_customer_manual_mail））

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信履歴は dtb_user_mail_history に customer_id、template_id、subject、mail_body、send_date を1件記録する。
　手動メール送信後は MailHistoryEntityManager::save が new MailHistory() を persist する。MailHistory は dtb_mail_history にマップされ、DtbUserMailHistory は dtb_user_mail_history へマップされるが deprecated コメント付きで、会員手動メール保存処理からは使用されていない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3812 ／ 実装: src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:39, src/Eccube/Entity/MailHistory.php:25, src/Eccube/Entity/DtbUserMailHistory.php:21）

■管理-M08-08 【新規】手動メール通知(確認画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）件名の最大長はメール作成フォームの確認値に準ずる。
　CustomerManualMailType の mail_subject は NotBlank のみ。メール作成フォーム MailType の mail_subject は NotBlank と Length(max eccube_stext_len) を持つ。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-16:3796 ／ 実装: src/Eccube/Form/Type/Admin/CustomerManualMailType.php:62, src/Eccube/Form/Type/Admin/MailType.php:64）

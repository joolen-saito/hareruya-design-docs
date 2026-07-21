■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）手動メール作成画面は GET /{admin_route}/customer/manual_mail（クエリで会員IDを指定）および GET /{admin_route}/customer/manual_mail/{customerId}/{templateId} で表示する。
　実装ルートは `/%eccube_admin_route%/customer/manual_mail/{id}/{template_id}` の `admin_customer_manual_mail` のみ。会員IDをクエリで受ける `/customer/manual_mail` 入口は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3598 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:150）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレートID指定がある場合、会員向けベース（会員・会員英語・ベースなし）に該当するテンプレートのみを対象とし、該当が無い場合は404とする。
　`#[MapEntity(id: 'template_id')] ?MailTemplate $MailTemplate` で任意の MailTemplate を解決し、`CustomerManualMailType` の選択肢は file_name で絞るが、URLで渡されたテンプレート自体のベース種別を検証して404にする処理はない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3608 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:152）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート未選択で表示する場合、件名・本文の入力欄は出さない。本文はテンプレート選択時のみ表示する複数行入力（textarea）。
　`mail_manual.twig` は MailTemplate の有無で分岐せず、件名入力 `form.mail_subject` と本文 textarea `form.body` を常に表示する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3619 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_manual.twig:71）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォームキーは件名 `mail[subject]`、本文 `mail_body`、ヘッダ・フッタ `mail[header]`・`mail[footer]` とし、テンプレートのヘッダ・フッタは隠し入力として送信に含める。
　フォームは `admin_customer_manual_mail` プレフィックス配下の `mail_subject` と `body` を定義し、`header`/`footer` フィールドは定義していない。Twigにもヘッダ・フッタ hidden の送信がない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3616 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerManualMailType.php:62）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）手動メール送信成功後は送信成功を表示し、同じ会員・テンプレートの作成画面へ戻る。
　成功フラッシュ追加後、`admin_customer_edit`（会員編集画面）へリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3610 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerMailController.php:201）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信したメールは会員向けメール送信履歴テーブル `dtb_user_mail_history` に、customer_id、template_id、subject、mail_body、send_date として記録する。
　実装は `MailHistory` エンティティを生成して `dtb_mail_history` に保存する。`DtbUserMailHistory` は存在するが deprecated コメント付きで、保存処理からは使われていない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3593 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/EntityManager/MailHistoryEntityManager.php:39）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）送信履歴は会員・テンプレート・件名・本文・送信日時を保持する。手動メールでは作成者の記録は持たない。
　`MailHistory` には `setCreator()` があり、Doctrine prePersist/preUpdate の共通処理が `setCreator($creator)` を呼ぶため、ログイン管理者がいる場合 creator_id が設定される。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3613 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Doctrine/EventSubscriber/SaveEventSubscriber.php:51）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）手動メール送信では、件名と本文は送信内容を用いる。
　`sendCustomerManualMail()` は送信件名を `'['.$shopName.'] '.$formData['mail_subject']` に組み立て、入力件名に店舗名プレフィックスを追加する。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3610 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:1028）

■管理-M08-08 手動メール通知(入力画面)
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フロント挙動の表示要素として、見出し「手動メール送信」を表示する。
　入力画面のタイトル・カードタイトルは `admin.customer.manual_mail` を表示し、翻訳値は「手動メール通知」。顧客手動メール用の「手動メール送信」見出しは確認できない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-15:3603 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/mail_manual.twig:43）

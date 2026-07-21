■管理-M10-09 メール設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート項目の選択肢は「登録されているメールテンプレート全種」とする。
　メール設定メニューは admin_mall_mail へ到達するが、MailType のテンプレート選択肢は baseInfo 一致かつ isAutoSend=false のテンプレートだけを抽出している。自動送信メールは AutoMailType 側で別画面に分離されている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-10:2937 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php:52）

■管理-M10-09 メール設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本文項目はラベル「本文」、最大値65536文字として表示・入力できる。
　画面ラベルは翻訳キー admin.setting.shop.mail.mail_text（日本語: テキスト）で表示され、tpl_data は TextareaType だが Length(65536) や maxlength はなく TwigLint のみを検証している。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-10:2939 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/mall/mail/detail.twig:197, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/MailType.php:71）

■管理-M10-09 メール設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）「基本情報編集」見出し直下のブロック内で、店舗営業時間の直下にメール4欄を、送信元メールアドレス（From）→問い合わせ受付メールアドレス（From, ReplyTo）→返信受付メールアドレス（ReplyTo）→送信エラー受付メールアドレス（ReturnPath）の順に表示する。
　店舗営業時間の後に business_hour_en が入り、その後のメール欄順は email01（送信元）→email03（返信先）→email04（送信エラー通知）→email02（問い合わせ専用）である。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-10:2996 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:143, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:150, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:160, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:170, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Setting/Shop/shop_master.twig:180）

■管理-M10-09 メール設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）MailService のヘッダ割当は、問い合わせ受付メールでは From/Bcc/Reply-To に email02、管理画面からの仮会員確認メール再送では From に email03 を使用する。
　sendContactMail は問い合わせ種別の email があればそれを adminEmail とし、From/Bcc/Reply-To に使用する。sendAdminCustomerConfirmMail は From に email01 を使用する。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-10:3027 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:343, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:357, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/MailService.php:542）

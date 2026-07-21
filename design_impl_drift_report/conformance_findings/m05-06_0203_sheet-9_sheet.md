■管理-M05-06 メール一括送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）テンプレート未選択の一括手動メール入力画面では、件名・確認ボタンをテンプレート選択まで無効扱いにする。
　確認ボタンは id 未指定時に disabled になるが、件名は通常の form_row(form.subject) として描画され、FormType 側にも disabled/readonly 条件がない。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-9:3155 ／ 実装: src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:79,80,155-160 / src/Eccube/Form/Type/Admin/OrderManualMailAllType.php:56-63）

■管理-M05-06 メール一括送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）右カラムの表示用注文番号、および受注メール本文内の注文番号表記は Order#getOrderNo() を用いる。
　右カラム用 OrderUtil::getOrderNumbers は getOrderNumber() を返し、createManualBody も orderNumber に getOrderNumber() を渡している。getOrderNo() は order_no 列、getOrderNumber() は order_number 列で別フィールド。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-9:3164,3185 ／ 実装: src/Eccube/Util/OrderUtil.php:37 / src/Eccube/Controller/Admin/Order/MailController.php:464 / src/Eccube/Entity/Order.php:450,850,633,1731）

■管理-M05-06 メール一括送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一括メール送信履歴は dtb_mail_history に template_id, order_id, customer_id, buy_order_id, creator_id, base_info_id を紐付ける。
　sendManualMailForBulk() は saveUserMailHistory($message, $template, $order) を呼び、creator 引数を渡さない。saveUserMailHistory() は既定値 null の $creator を setCreator($creator) する。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-9:3150 ／ 実装: src/Eccube/Service/MailService.php:2088,2103,2111,2118）

■管理-M05-06 メール一括送信
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）一括手動メール画面の右カラム送信先テーブルには注文番号・注文者名を表示する。
　送信先テーブルの注文者名は Order.name01/name02 ではなく Order.customer.name01/name02 を表示する。受注詳細メール画面では Order.name01/name02 を注文者情報として表示している。確認お願いします。（設計根拠: excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-9:3158 ／ 実装: src/Eccube/Resource/template/admin/Order/manual_mail_all.twig:123-125 / src/Eccube/Resource/template/admin/Order/manual_mail_all_confirm.twig:130-131 / src/Eccube/Entity/Order.php:886,904）

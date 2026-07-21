■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）サイドメニュー上の親グループは「データ管理」配下で、メニュー選択状態は menus = ['data_menu', 'config_list'] とする。
　追加システム設定テンプレートは menus = ['setting', 'basic_info', 'add_system_setting']、サブタイトル admin.setting.basic_info、bootstrap_4_horizontal_layout を使用している。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:3995,4016 ／ 実装: src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:3,6,8）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フォーム送信は method="post"、アクションは GET で画面を開くのと同じパスを指す生成URLとする。
　GET は /setting/shop/additional_system、POST は /setting/shop/additional_system/update に分かれ、Twig の form action も admin_setting_shop_additional_system_update を指す。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:4016 ／ 実装: src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php:41,64; src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:13）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入力項目表のスマレジ契約IDを表示・保存し、削除指定されたスマレジ店舗ID/スマレジ部門IDは追加システム設定から削除する。
　smaregi_contract_id 定数は存在するがフォーム/Twigに追加されていない。画面では smaregi_store_id が「スマレジ契約ID」ラベルで描画され、smaregi_category_id も描画される。さらに設計表にない weekly_stock_history_error_mail_address と unisearch_sftp_host も表示される。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:3892-3898,3925,4032 ／ 実装: src/Eccube/Entity/Master/MtbOption.php:42,61,63,95,105; src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:76,95,184,221; src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:65,68,92,95,193,241）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取査定申込み完了画面の自動遷移秒数は、数値（整数）かつ0以上、任意、初期値15とする。
　otcbuy_order_return_seconds は IntegerType required=false で初期値15はあるが、GreaterThanOrEqual(0) 制約がない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:3924,4032 ／ 実装: src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:72）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）購入処理エラー通知先メールアドレスとイベント決済確認エラー通知メールアドレスを、それぞれ別項目として表示・編集できる。
　Twig はイベント決済確認エラー通知メールアドレスのラベルを出しながら、widget/errors は shopping_error_mail_address を描画している。check_payment_error_mail_address の widget はテンプレート内に存在しない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:3936-3937,4032 ／ 実装: src/Eccube/Entity/Master/MtbOption.php:87,89; src/Eccube/Resource/locale/messages.ja.yaml:4188,4189; src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:175,178）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取部門集計送信、必須項目空欄会員、ポイント未反映決済、ポイント差分、購入処理エラー、イベント決済確認エラー、身分証期限切れの各通知メールは、カンマ区切り複数メールの正規表現で検証する。
　対象メール項目は Symfony Email 制約と Length 制約で実装されており、カンマ区切り複数メール用 Regex はない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:4032 ／ 実装: src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:135,142,149,156,163,170,177）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）査定払出し連絡用経理部門メールアドレスは任意、Eメール形式、最大255文字の入力項目として18と19の間に追加する。
　otc_buy_order_accounting_payment_pending_mail_address はフォーム上 required=true で定義されている。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:3939,3976 ／ 実装: src/Eccube/Form/Type/Admin/AdditionalSystemFormType.php:191; src/Eccube/Resource/template/admin/Setting/Shop/additional_system.twig:202）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存成功時はフラッシュ成功メッセージ（翻訳キー admin.register.complete）を積み、リダイレクト後のGETで画面全体を再描画する。
　保存成功時に addSuccess('admin.common.save_complete', 'admin') を実行する。admin.common.save_complete は「保存しました」、admin.register.complete は「登録が完了しました。」である。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:4044,4061 ／ 実装: src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php:103; src/Eccube/Resource/locale/messages.ja.yaml:1559,1934）

■管理-M10-16 追加システム設定
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）当画面の保存処理では mtb_option.update_date を現在時刻へ進める処理を同一メソッド内に持たず、option_value と member_id のみを更新対象として明示する。
　変更検出時に option_value と member に加えて setUpdateDate(new \DateTime()) を呼び出している。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-14:4035,4048 ／ 実装: src/Eccube/Controller/Admin/Setting/Shop/AdditionalSystemController.php:92,95; src/Eccube/Entity/Master/MtbOption.php:179,187）

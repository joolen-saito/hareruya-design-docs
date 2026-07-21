■管理-M08-09 配送先編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）配送先一覧を表示する（GET /{admin_route}/customer/{id}/delivery ）、配送先を編集する（GET/POST /{admin_route}/customer/delivery/{id}/update ）、配送先を削除する（DELETE /{admin_route}/customer/delivery/{id}/delete ）として入口・画面遷移を提供する。
　実装は配送先一覧専用の GET /customer/{id}/delivery を持たず、会員編集画面内に配送先一覧を埋め込む。編集は /customer/{id}/delivery/{did}/edit、削除は /customer/{id}/delivery/{did}/delete で、設計の /customer/delivery/{id}/update・/customer/delivery/{id}/delete と異なる。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-17:3990,3997-4002,4031-4032 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:45,46,127 / src/Eccube/Resource/template/admin/Customer/edit.twig:753,786 / 不在（探索範囲: src/Eccube/Controller/Admin/Customer, src/Eccube/Resource/template/admin/Customer, html。検索語: m08-09_admin_customer_customer_delivery, customer/{id}/delivery, customer/delivery/{id}/update, customer/delivery/{id}/delete））

■管理-M08-09 配送先編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）配送先海外用郵便番号は最大文字数100とする。
　abroadPostalCode は eccube_abroad_postal_code_len を最大長にし、設定値およびDBカラム長はいずれも10。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-17:3910 ／ 実装: src/Eccube/Form/Type/Front/CustomerAddressType.php:118-123 / app/config/eccube/packages/eccube.yaml:154 / src/Eccube/Entity/CustomerAddress.php:495）

■管理-M08-09 配送先編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）編集保存時に郵便番号の整合を確認する。送信され検証に通り、郵便番号の整合確認を満たす場合に内容を確定する。
　実装は郵便番号の数値・桁数、国が日本の場合の郵便番号必須、国が日本以外の場合の海外郵便番号必須を検証するが、郵便番号と都道府県/住所の整合確認は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-17:4000,4007-4008,4034-4035 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php, src/Eccube/Form/Type/Front/CustomerAddressType.php, src/Eccube/Form/Type/SplitPostalType.php, src/Eccube/Form/Type/AddressType.php, src/Eccube/Repository, html。検索語: 郵便番号整合, 整合, postal pref, postal addr, zip2addr, PostalCode））

■管理-M08-09 配送先編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存完了メッセージはロケールキー admin.customer.save.complete を使用する。
　保存成功時は admin.common.save_complete を addSuccess しており、messages.ja.yaml には admin.common.save_complete: 保存しました がある。admin.customer.save.complete は見つからない。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-17:4004-4005 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:107 / src/Eccube/Resource/locale/messages.ja.yaml:1405 / 不在（探索範囲: src/Eccube/Resource/locale, src/Eccube/Controller/Admin/Customer。検索語: admin.customer.save.complete））

■管理-M08-09 配送先編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除後は配送先一覧へ戻る。
　削除完了後は admin_customer_edit にリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-17:4031-4032 ／ 実装: src/Eccube/Controller/Admin/Customer/CustomerDeliveryEditController.php:166）

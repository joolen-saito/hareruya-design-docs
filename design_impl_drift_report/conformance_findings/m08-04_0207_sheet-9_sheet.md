■管理-M08-04 会員登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）名前（カナ）・郵便番号はプラグイン拡張で必須を解除する。郵便番号は任意入力として扱う。
　admin_customer の postalCode は required=true で追加され、postalCode01/02 は空欄でも各3桁/4桁の Length(min=max) 制約を受ける。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-9:2619 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/CustomerType.php:79 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/SplitPostalType.php:44）

■管理-M08-04 会員登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）住所1・住所2はSJIS換算の長さが上限を超える場合に超過エラーを付ける。
　住所1/住所2は Symfony Assert\Length(max=eccube_address1_len/eccube_address2_len) で検証している。SJIS/Shift_JIS/CP932換算のバイト長検証は見つからない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-9:2594 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/AddressType.php:108）

■管理-M08-04 会員登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）本人確認ステータスが未確認以外から未確認に変更、かつ身分証有効期限が入力済みの場合に身分証有効期限を空欄で更新する。
　登録ボタン押下時のJSは本人確認ステータスを未確認へ変更するが、身分証有効期限を空欄化しない。id_expiration_date は mapped=false で、通常の会員編集保存では setIdExpirationDate(null) も呼ばれない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-9:2317 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:37 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/PlayerType.php:79 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:171）

■管理-M08-04 会員登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）買取履歴欄の買取番号リンク押下時、買取詳細画面に遷移する。
　買取履歴の BuyOrder.id リンクは admin_order_edit を生成している。一方、買取詳細画面の route は admin_purchase_edit。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-9:2456 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Customer/edit.twig:961 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Purchase/PurchaseController.php:199）

■管理-M08-04 会員登録編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）本人確認フラグは必須のラジオ（未確認／確認）として会員登録フォームで扱い、選手情報 dtb_player.identification_flg に保存する。
　dtb_player.identification_flg のエンティティ列は存在するが、Admin Customer のフォーム項目・画面表示・保存用入力としては追加されていない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-9:2597 ／ 実装: 不在（探索範囲: src/Eccube/Form/Type/Admin/CustomerType.php, src/Eccube/Form/Type/Admin/PlayerType.php, src/Eccube/Resource/template/admin/Customer/edit.twig, src/Eccube/Controller/Admin/Customer/CustomerEditController.php, src/Eccube/Resource/locale/messages.ja.yaml。DB列のみ src/Eccube/Entity/DtbPlayer.php:79））

■管理-M08-04 会員登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）保存成功時は表示文言「会員情報を保存しました。」を表示する。
　保存成功時は admin.common.save_complete を addSuccess し、翻訳文言は「保存しました」。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0207_基本設計仕様書(会員管理機能).html#sheet-9:2633 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Customer/CustomerEditController.php:211 /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1559）

■管理-M05-27 店頭注文番号札管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）初期表示時はメンバー管理で設定されているデフォルト検索表示店舗で絞り込み、デフォルト検索表示店舗が「ALL」または「全店」の場合は「TC東京」を表示する。
　初期GETでは DtbWaitingTag にログインメンバーの getBaseInfo() を設定し、一覧検索もその BaseInfo を使う。Member::getDefaultSearchBaseInfo() や ALL/全店時に TC東京へフォールバックする分岐はない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-26:7989,7997,7998,8011,8015 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/WaitingTagController.php:51,52,67,70 ／ 不在（探索範囲: WaitingTagController.php, WaitingTagType.php, waiting_tag.twig, WaitingTagStoreAction.php, WaitingTagDeleteAction.php の getDefaultSearchBaseInfo/defaultSearchBaseInfo/TC_TOKYO_ID/ALL_STORE_KEY））

■管理-M05-27 店頭注文番号札管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ユーザーが編集権限を保持している店舗に関連付けられたデータを編集可能とし、該当データに対して削除ボタンを表示する。
　画面は登録ボタンを form.BaseInfo.vars.value == BaseInfo.id のときだけ表示し、削除ボタンを WaitingTag.BaseInfo.id == BaseInfo.id のときだけ表示する。DELETE ハンドラは URL の DtbWaitingTag を削除処理へ渡すだけで、Member::isEditableShop() 等の編集権限判定を使用しない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-26:7990,7991,8016 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/waiting_tag.twig:84,118 ／ /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/WaitingTagController.php:129,135 ／ /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Member.php:78）

■管理-M05-27 店頭注文番号札管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）削除リンク押下でJavaScriptポップアップを表示し、「[店頭注文番号]を を削除してもよろしいですか？」を表示し、「OK」をクリックすると当該の店頭注文番号を一覧から除去する。
　削除操作は Bootstrap モーダルを開き、本文は共通翻訳 admin.common.delete_modal__message（「この操作はあとから取り消すことができません。「%name%」を削除してよろしいですか？」）を使う。確定ボタンの表示文言は admin.common.delete の「削除」。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-26:8016 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/waiting_tag.twig:121,123,156,158 ／ /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1754）

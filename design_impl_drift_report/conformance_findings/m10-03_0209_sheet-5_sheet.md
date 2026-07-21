■管理-M10-03 利用規約管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）移行先（ec-cube-enterprise）では、ご利用規約をページ管理上の固定ページ（dtb_page の help_agreement／テンプレート Help/agreement）の本文として保持・編集し、設定→基本情報設定配下の利用規約設定導線から本文を入力して送信できること。
　設定メニューの shop_agreement は Page::AGREEMENT_PAGE_ID=19 の admin_content_page_edit へ遷移し、help_agreement 固定ページを編集対象にしている。ただし page_edit.twig は is_user_data_page でない既定ページの場合に Ace エディタを readOnly にするため、管理画面上で利用規約本文を編集できない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-5:2017,2019,2025 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:220, /home/y-saito/Developments/ec-cube-enterprise/app/config/eccube/packages/eccube_nav.yaml:223, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Page.php:46, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/page_edit.twig:57, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/page_edit.twig:58）

■管理-M10-03 利用規約管理
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用規約設定画面は、保存成功時に同一編集画面へGETリダイレクトし、検証失敗時も同一画面を再描画する。メニューおよび関連ヘッダでは利用規約／利用規約管理（移行先実装では利用規約設定）として表示されること。
　page_edit.twig は query の return=agreement がある場合だけ menus=['setting','basic_info','shop_agreement'] と page_title=admin.setting.shop.agreement_setting を使う。しかしフォーム action は locale だけを付与し return=agreement を保持せず、保存成功後の redirectToRoute も id と locale だけで return=agreement を保持しない。確認お願いします。（設計根拠: excel_to_html/output/0209_基本設計仕様書(基本情報設定).html#sheet-5:2002,2025,2034,2036,2075 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/page_edit.twig:18, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/page_edit.twig:23, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Content/page_edit.twig:96, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Content/PageController.php:313）

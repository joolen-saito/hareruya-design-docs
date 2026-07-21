■管理-M06-04 ステータス変更
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）ステータス変更画面はITチームのみが使用可能な画面とする（権限で設定）。
　ステータス変更のGET/POSTは管理画面認証後に isAccessibleRoute('admin_otcbuyorder_status') / isAccessibleRoute('admin_otcbuyorder_status_update') を確認しているが、ITチーム専用のロール・権限キー・PermissionAccessUrl登録は確認できない。IsAccessibleRouteExtension は会員権限の deny_url に一致した場合だけ false を返し、それ以外は true を返す実装である。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-11:3170 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:302; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:337; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Twig/Extension/IsAccessibleRouteExtension.php:65; 不在（探索範囲: src/Eccube/Controller/Admin/OtcBuyOrder, src/Eccube/Twig/Extension, app/DoctrineMigrations（sql除外）, app/config/eccube/packages/eccube_nav.yaml））

■管理-M06-04 ステータス変更
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）経理払い出し済みボタンを詳細画面につけて、経理のみ更新可能とする。
　詳細画面の「経理払出し済」ボタンとPOST処理は存在する。POST処理はCSRF、ログインMember、編集可能店舗、isAccessibleRoute('admin_otcbuyorder_update_status_account_team_paid')、現在ステータスが経理払出し待ちであることを確認して STATUS_COMPLETE に更新する。ただし、経理ロールまたは経理専用権限に限定する実装は確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-11:3144 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:389; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:400; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:405; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:411; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:470; 不在（探索範囲: src/Eccube/Controller/Admin/OtcBuyOrder, src/Eccube/Twig/Extension, app/DoctrineMigrations（sql除外）, app/config/eccube/packages/eccube_nav.yaml））

■管理-M06-04 ステータス変更
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）入庫済みボタンを詳細画面につけて、買取管理を使えるユーザが更新可能とする。
　詳細画面の「入庫済みにする」ボタンとPOST処理は存在する。POST処理はCSRF、ログインMember、編集可能店舗を確認し、STATUS_STOCKING_COMPLETE へ更新する。一方で、同Controllerのステータス変更POSTや経理払出し済POSTにある isAccessibleRoute によるルート権限チェックすら restocked POST には存在せず、買取管理を使えるユーザに限定する実装を確認できない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html#sheet-11:3146 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:457; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:469; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:474; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:481; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/OtcBuyOrder/detail.twig:473; 不在（探索範囲: src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php 内の admin_otcbuyorder_update_status_restocked 権限チェック、app/DoctrineMigrations（sql除外）, app/config/eccube/packages/eccube_nav.yaml））

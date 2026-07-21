■管理-M03-09 商品規格登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）フロント表示制御としては”公開”の場合は表示、”非公開（廃止）”の場合は非表示とする
　フロントの商品詳細・一覧系の規格抽出は商品本体の公開状態と ProductClass.visible を見ているが、ProductClass.Status が公開かどうかを条件にしていない。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5291 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductRepository.php:103, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Front/ProductController.php:1361, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/Product.php:1342, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/ProductClassRepository.php:3147）

■管理-M03-09 商品規格登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）スマレジ商品コードは、シングルカードの場合は読み取り専用、その他の場合は編集可能とする。また、スマレジ連携フラグをONにした際にスマレジ商品コードがない場合はエラーとし、シングルカードの場合は自動採番する。
　スマレジ商品コードは常に通常のテキスト入力として描画され、フォーム定義では required=false。連携ONでもコード空欄の場合、スマレジ連携サービスはエラーにせず return する。管理画面登録/更新での自動採番処理は確認できない。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5357 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:282, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:286, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:284, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/ProductClassType.php:285, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/SmaregiProductClassEventService.php:41）

■管理-M03-09 商品規格登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）利用者視点の入口 URL は、規格一覧 /{admin_route}/product/product/{id}/class/list、新規 /{admin_route}/product/product/{id}/class/new、登録 POST /{admin_route}/product/product/{id}/class/new/create、編集 /{admin_route}/product/product/{id}/class/{classId}/edit、更新 POST /{admin_route}/product/product/{id}/class/{classId}/edit/update、削除 DELETE /{admin_route}/product/product/{id}/class/{classId}/edit/delete とする。
　実装ルートは /product/product/class/{id}, /product/product/class/{id}/new, /product/product/class/{id}/store, /product/product/class/{id}/edit/{productClassId}, /product/product/class/{id}/update/{productClassId}, /product/product/class/{id}/delete/{productClassId}。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5478 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:72, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:102, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:125, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:174, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:199, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:262）

■管理-M03-09 商品規格登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）検証失敗時は「登録できませんでした。」を設定し、成功時は「登録が完了しました。」を設定して同じ規格の編集画面へリダイレクトする。
　検証失敗時は admin.common.save_error（保存に失敗しました）、成功時は admin.common.save_complete（保存しました）を使う。保存成功後は新規/更新とも商品規格一覧へリダイレクトする。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5488, excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5534 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:134, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:166, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:168, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:212, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:257, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:259, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1405, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/locale/messages.ja.yaml:1406）

■管理-M03-09 商品規格登録編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）編集時かつ規格が削除可能な場合は削除ボタンを表示し、削除可能でない（最後の1件）場合は不正要求（HTTP400）とする。削除可能なら規格を論理削除し、永続化を確定する。
　削除ボタンは ProductClass.id があれば常に表示される。削除処理は最後の1件かどうかを検査せず ProductClassDeleteAction::handle に渡し、Action は entityManager->remove($ProductClass) で物理削除する。確認お願いします。（設計根拠: excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5486, excel_to_html/output/0204_基本設計仕様書(商品管理).html#sheet-22:5490 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:568, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Product/ProductClass/edit.twig:571, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:262, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductClassController.php:272, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:39, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Product/ProductClassDeleteAction.php:66）

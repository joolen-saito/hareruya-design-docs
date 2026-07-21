■管理-M05-11 受注情報編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）受注の新規登録は行えないようにする（新規登録機能は廃止）。
　admin_order_new の GET/POST ルートが存在し、id が null の場合に新規 Order と Shipping を生成する。登録処理でも新規 Order を flush できる経路がある。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-15:4443,4512-4513,4538-4539 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:146; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:203; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:643）

■管理-M05-11 受注情報編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）ログインしているメンバーの編集可能店舗に紐づいている店舗の受注データの場合は編集可能とする。
　Member::isEditableShop は存在するが、受注編集 Controller/Form/Twig の表示・更新・登録処理で受注店舗とログインメンバーの編集可能店舗を照合していない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-15:4514-4515,4540-4541 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order/EditController.php, src/Eccube/Resource/template/admin/Order/edit.twig, src/Eccube/Form/Type/Admin/OrderType.php, src/Eccube/EventListener, src/Eccube/Security; 反証検索: isEditableShop, editableShop, MemberBaseInfo, BaseInfo, admin_order_edit, AccessDenied））

■管理-M05-11 受注情報編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）スマレジ取引の場合は編集不可とし、スマレジから連携されてきたデータは更新不可とする。編集が必要な場合はスマレジ側で編集を行う。
　Twig はスマレジ取引IDを表示するだけで、スマレジ取引の各入力項目・登録ボタンを編集不可にしていない。Controller もスマレジコードがある受注を保存対象から除外せず、保存後にスマレジ API 連携を行う分岐がある。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-15:4516-4518,4540-4542 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:823; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:937; /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/EditController.php:678）

■管理-M05-11 受注情報編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）受注データに対する変更が発生した場合に履歴として保持し、履歴情報はそれぞれの編集画面で参照できるようにする。
　受注編集画面にはメール履歴ブロックはあるが、受注データ更新履歴の保存・取得・表示に相当する Entity/Repository/Controller/Twig が確認できない。Controller の受注保存処理でも汎用の受注更新履歴を作成していない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-15:4519-4521 ／ 実装: 不在（探索範囲: src/Eccube/Controller/Admin/Order, src/Eccube/Resource/template/admin/Order, src/Eccube/Entity, src/Eccube/Repository, src/Eccube/Service; 反証検索: 受注データ更新履歴, 更新履歴, OrderHistory, order_history, DtbOrderHistory, history））

■管理-M05-11 受注情報編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）注文者情報、お支払情報、お届け先情報、ポイント連携エラーの各ブロックはアコーディオンで開閉し、初期状態は閉じた状態でタイトルのみ表示する。
　ポイントエラーメッセージのブロックは body 側に collapse show が付与されており、初期表示で展開される。注文者情報・お支払情報・お届け先情報は既存受注では閉じる実装になっている。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html#sheet-15:4549-4553 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Order/edit.twig:1803）

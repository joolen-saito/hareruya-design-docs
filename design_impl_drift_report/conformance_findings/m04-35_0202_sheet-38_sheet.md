■管理-M04-35 棚卸計画新規作成
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）棚卸計画新規作成画面で、新規の棚卸計画を登録し、棚卸名・店舗・在庫区分・備考を入力して「登録」押下後に棚卸計画編集画面へ遷移する。
　DtbInventoryPlan Entity/Repository は存在するが、棚卸計画新規作成の Controller/FormType/Twig/登録ルートは確認できない。`admin_inventory_plan` は在庫履歴リンク先定義にのみ存在する（/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbStockHistory.php:41）。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-38:15037 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller, Form, Service, Repository, Resource/template/admin, Resource/config, Resource/locale および /home/y-saito/Developments/ec-cube-enterprise/html。反証検索: InventoryPlan, inventory_plan, inventory-plan, admin_inventory_plan, 棚卸計画新規作成, 棚卸計画編集, 棚卸名））

■管理-M04-35 棚卸計画新規作成
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）店舗は必須セレクトボックスで、デフォルト表示の店舗を初期値とし、店舗管理に登録されており閉店となっていない店舗のみを選択肢にする。登録時、編集権限のない店舗が選ばれた場合はエラーにする。
　DtbInventoryPlan には name, memo, member_id 等はあるが、店舗を保持する BaseInfo 関連カラム/関連プロパティが確認できない。店舗選択用 FormType、非閉店店舗への選択肢制限、Member::isEditableShop による登録時チェックを行う棚卸計画用 Controller/Service も不在。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-38:15043 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbInventoryPlan.php:36）

■管理-M04-35 棚卸計画新規作成
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）在庫区分は必須ラジオボタンで、初期値はEC-CUBE、選択肢はEC-CUBEとスマレジにする。
　DtbInventoryPlan Entity には在庫区分/stock_location 相当のカラムや関連プロパティが確認できない。棚卸計画新規作成用 FormType も不在。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-38:15053 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity/DtbInventoryPlan.php:36）

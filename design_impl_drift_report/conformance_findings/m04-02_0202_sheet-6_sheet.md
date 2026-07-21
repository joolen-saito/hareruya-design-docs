■管理-M04-02 在庫編集
【指摘カテゴリ】
　未実装
【指摘内容】
　（仕様）総原価及び商品ごとの原価単は一日単位で記録し、呼び出せるようにする
　ProductStock は現在値の total_cost と getUnitCost() を持ち、DtbStockHistory は在庫変動時の unit_cost_price_before/after と total_cost_price_before/after を持つが、商品規格または在庫単位で1日ごとの総原価・原価単価を記録し呼び出す履歴テーブル、バッチ、Repository、APIは確認できなかった。DtbDailySummary は店舗別の日次売上集計、DtbWeeklyStockHistory は在庫数のみの週次履歴であり本要求の保存先ではない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-6:2371 ／ 実装: 不在（探索範囲: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Command, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Entity, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository, /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/admin/Stock, /home/y-saito/Developments/ec-cube-enterprise/html。検索語: 日単位, 一日単位, daily cost, unit_cost date, total_cost date, 原価単価 日, 総原価 日, stock cost history））

■管理-M04-02 在庫編集
【指摘カテゴリ】
　実装違い
【指摘内容】
　（仕様）識別ID:3-6 承認通知先（所属選択）は、共通処理識別ID1-1を参照し、編集している在庫を保持している店舗の所属マスターデータから取得し選択肢とする。共通処理では所属マスターから取得し、所属マスターデータの並び順項目の昇順で表示する。
　StockApprovalType::getDepartmentChoices() は memberRepository->findBy(['baseInfo' => $BaseInfo]) で対象店舗のメンバーを取得し、各 Member の Department 名を選択肢化している。DepartmentRepository または mtb_department を直接参照せず、mtb_department.sort_no 昇順でもない。確認お願いします。（設計根拠: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-6:2484; /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html#sheet-3:994 ／ 実装: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Form/Type/Admin/StockApprovalType.php:224）

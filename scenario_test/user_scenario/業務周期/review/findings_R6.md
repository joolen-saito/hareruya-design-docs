主張: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務周期/scenario_list.md:291` の UCY-22 は、受注一覧で印刷予約した受注について、新実装では予約解除のみで対応状況は変わらず、印刷失敗時も対応状況は変わらないとする。同:401 は設計書との食い違いとする。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Order/OrderController.php:1023-1025` は「注文受領」の受注に状態変更フラグを立て、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:51-58` は印刷予約時に「ピック中」へ変更し、注文確定日を登録する。これは `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0203_基本設計仕様書(受注管理機能).html:2313` の「注文受領である場合はピック中に変更し、注文確定日を登録する」と一致する。印刷失敗時も予約時の変更は残る。
判定: 事実の誤り
修正案: UCY-22 に受注一覧での予約時点で「注文受領→ピック中」となる経路を加え、この点の設計書との食い違いを取り消す。

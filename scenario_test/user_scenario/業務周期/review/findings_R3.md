主張: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務周期/scenario_list.md:146` の UCY-02 は「前日の受注明細が0件の商品規格・店舗は更新されず前回の値が残る」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1078` は「集計対象期間に受注明細が1件も無かった集計単位」が更新対象外とする。前日は0件でも、ほかの集計期間に販売があれば前日販売数は0で集計される。新実装も `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/DtbSalesQuantityRepository.php:668` で該当しない販売数を0としている。
判定: 事実の誤り
修正案: 旧値が残る条件を「全集計対象期間に明細が無い場合」に直し、新実装が集計前に既存行を全削除する設計書との差も記録する。

主張: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/業務周期/scenario_list.md:164` の UCY-20 は、週間在庫履歴を「EC-CUBEとスマレジを合算」して作るとし、実装との差を記録していない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0402_基本設計仕様書(バッチ_在庫).html:1216-1217` は「ECCUBE、スマレジの在庫を合算」と定める一方、`/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Product/BatchUpdateWeeklyStockHistoryAction.php:41-46` はスマレジ在庫の取り込みを「未実装」と明記している。
判定: 事実の欠落
修正案: UCY-20に設計書上の期待値を残し、現行の新実装ではスマレジ在庫が合算されない食い違いを記録する。

主張: 業務横断/matrix_UXB-16/README.md:60（UXB-16）は、クレジットカード決済・コンビニ決済・振込・代金引換を「状態の遷移も変わらない」として代表水準にまとめている。
実際: hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:37は、購入直後をカード「入金済み」、銀行振込「入金待ち」、その他の該当方法「注文受領」と定める。hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:122は、流れ・処理・期待値のいずれかが変われば水準を分ける決まりである。
判定: 切り方の誤り
修正案: 購入直後の状態と入金確認の経路が異なる支払方法を分け、マトリクスを作り直す。

主張: 分析・集計/matrix_UAN-01/README.md:42とfl_table.tsv:7（UAN-01 C1）は、入金確認が要る支払方法をクレジットカード決済にまとめている。
実際: hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:31-32は、振込には担当者による入金確認、コンビニ決済には入金通知または結果照会を定める。hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:122は、業務の流れ・システムの処理が変わる種類を分ける決まりである。
判定: 切り方の誤り
修正案: 取引を作る工程までC1に含めるなら、入金確認の経路が異なる支払方法を分ける。

主張: 店頭受取受注管理/matrix_UOR-01/exceptions.tsv:5（UOR-01 E4）とscenario_list.mdのUOR-01は、スマレジ商品コードが無い注文の再連携先をUSM-07としている。
実際: hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:120のUSM-07は、対象を「スマレジ商品コードあり」とし、「スマレジ商品コードが無い」注文を対象外としている。
判定: 事実の誤り
修正案: E4からUSM-07への再連携参照を外し、コード未採番時の扱いをUSM-06に沿って書く。

主張: 店頭受取受注管理/matrix_UOR-01/exceptions.tsv:6（UOR-01 E5）は差し込む元の条件が空欄のまま、印刷失敗時は「対応状況は変わらず、ピック中にならない」と断定している。
実際: ec-cube-enterprise/src/Eccube/Service/Admin/Order/UpdateStackListAction.php:51-58は、受注一覧からの印刷では印刷結果より先に対応状況を「ピック中」に更新する。hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:59は、例外に必要な水準を元の条件へすべて書く決まりである。
判定: 切り方の誤り
修正案: E5の元の条件に自動印刷の水準J1を指定し、手動印刷には同じ状態期待値を適用しない。

主張: 分析・集計/matrix_UAN-01/fl_table.tsv:13（C7）とmatrix_UAN-05/fl_table.tsv:17（E4）の扱い欄には、今回USM-01を参照先に加えた後も「取引を作るシナリオが無い」と残っている。
実際: hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:114のUSM-01は、レジだけの買い物（A8・A9）について「取引から新しい受注だけが出荷完了で作られる」と定める。
判定: 事実の誤り
修正案: 両方の扱い欄から旧注記を除き、取引を作る参照先をUSM-01に揃える。

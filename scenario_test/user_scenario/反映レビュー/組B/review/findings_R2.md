主張: 分析・集計/scenario_list.md:18（UAN-01）と matrix_UAN-01/README.md:42 は、支払方法が違っても「出荷完了になれば同じ値で載る」とする。
実際: /home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0211_基本設計仕様書(分析・集計管理機能)_詳細設計.html:1319-1320 は総売上に「送料・手数料は含む」と定める。/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/README.md:47 は「代金引換は330円」「ほかの支払方法は0円」とする。同じ商品・送料でも総売上は同額にならない。
判定: 事実の誤り
修正案: 支払方法が違っても同じ注文日の行に載るとし、総売上は各受注の手数料を含めて計算する。

主張: 分析・集計/matrix_UAN-04/README.md:45（UAN-04）は、R13の支払方法を水準にせずまとめ、「入金日の基準だけが…変わる点」は判断待ちに分けたとする。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:31-32 は、銀行振込・郵便振替の入金確認とコンビニ決済の入金通知を別経路として定める。/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/分析・集計/matrix_UAN-04/fl_table.tsv:6 は入金日を検査対象とし、/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:122 は流れ・処理・期待値のどれかが変われば水準を分けると定める。
判定: 切り方の誤り
修正案: UAN-04の入金日を確かめる行では支払方法ごとの経路を分け、該当する期待値を割り当てる。

主張: 分析・集計/scenario_list.md:168（UAN-04、判断待ち7）は、入金済みを通らず直接出荷完了に進んだ受注に入金日が入るか「確かめていない」とする。
実際: /home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/OrderStateMachine.php:96-98 は入金日の登録先を「入金済みへ入るすべての遷移」とし、同:114-118 でその遷移時に入金日を設定する。/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Repository/OrderItemRepository.php:248-255 は入金日の列で期間を絞る。
判定: 事実の欠落
修正案: 入金済みを通らず入金日を登録しない経路は、入金日での期間検索に出ない期待値として記載する。

主張: 業務横断/matrix_UXB-16/README.md:72（H1）と分析・集計/matrix_UAN-01/README.md:42（C1）は、クレジットカード決済と登録済みカードを「処理が同じ」として一水準にまとめる。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/README.md:83 は「カード情報の入力画面の有無が違う」として両者を分ける。/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:122 は画面表示が変わる種類も水準を分けると定める。
判定: 切り方の誤り
修正案: 両マトリクスでカード情報を入力する決済と登録済みカード決済を別水準にし、行を作り直す。

主張: 在庫管理/scenario_list.md:29-32（UZK-03〜06）などは、分割・結合・在庫移動のスマレジ反映にも「連携中・失敗」を一律に付ける。
実際: /home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:116（USM-03）は「未承認→スマレジ連携中→承認済／スマレジ連携失敗」を在庫編集・一括編集・在庫変更CSVの状態とし、在庫移動は「出庫承認待ち→出庫承認済み→移動中→入庫完了」、分割・結合は「分割承認待ち／結合承認待ち→入庫完了」と分ける。
判定: 事実の誤り
修正案: USM-03への参照は残し、在庫編集承認の状態名を分割・結合・在庫移動の経路へ一律に当てない。

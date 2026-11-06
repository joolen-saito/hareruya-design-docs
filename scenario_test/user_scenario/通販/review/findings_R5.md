主張: [scenario_list.md:72](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:72)・[73](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:73) は、購入処理中から注文受領・入金待ちへの遷移をUTS-16・17にも割り当てている。
実際: [同ファイル:31](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:31)・[32](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:32) は両シナリオの起点をお客様の支払いとし、「注文の確定はUTS-01・UTS-04」と明記している。
判定: 事実の誤り
修正案: 購入処理中からの遷移の割当てをUTS-01・04に直す。

主張: [scenario_list.md:31](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/scenario_list.md:31) のUTS-16はお客様の振込を起点としながら、「入金より前の出荷準備」をL3に含めている。
実際: [16_通販受注管理.md:54](/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:54)・[58](/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/16_通販受注管理.md:58) は「出荷指示リストの生成」を行い、「出荷準備は入金が無くても進めて」いるとする。購入を終点とするUTS-01と、振込を起点とするUTS-16の間に、この処理を通るシナリオがない。
判定: 事実の欠落
修正案: 未入金受注の出荷準備を、その作業開始から準備完了までのL2として置く。

主張: [matrix/fl_table.tsv:31](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/fl_table.tsv:31) のポイント水準J2は、一部ポイント使用時の「残りはクレジットカード決済」としている。
実際: [rulings.md:20](/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md:20) は通販の支払方法を6種類と裁定しており、[matrix/matrix.md:41](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/matrix.md:41) のT29はJ2とコンビニ決済、[同ファイル:42](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/matrix.md:42) のT30はJ2と代金引換を組み合わせている。
判定: 事実の誤り
修正案: J2の残額は、その行で選んだ支払方法で払う記述に直す。

主張: [matrix/fl_table.tsv:42](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/fl_table.tsv:42) のK3は「Small packetの上限金額を超える」、[43](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/通販/matrix/fl_table.tsv:43) のK4は「30万円以上」で、同じ金額が両水準に入る。
実際: [現行実装 MtbOption.php:114](/home/y-saito/Developments/pf-eccube3/app/Plugin/HareruyaEc/Entity/MtbOption.php:114) のSmall packet上限の初期値は「50000」。30万円以上の商品金額はK3の条件も満たす。
判定: 事実の誤り
修正案: K3の上限を30万円未満と明記し、K4と重ならない水準にする。

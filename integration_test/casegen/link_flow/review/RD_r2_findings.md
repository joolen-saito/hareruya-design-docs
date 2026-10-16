### 指摘1（重大度: Major）対象: IT-M04-22-RD002
主張: `rd-transfer-002.csv` の列を「振替元商品コード、振替先商品コード、振替点数」として取り込み、振替元の在庫履歴を確認する。
実際: 同じ設計シートの入力チェックは、許可する列を「振替元商品コード、振替先商品コード、**移動点数**」とする一方、登録CSV定義は「**振替点数**」とする（[0202 HTML:6336](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:6336)、[同:6372](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:6372)）。シードは後者を採用している（[RD_seed_data.tsv:21](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RD_seed_data.tsv:21)）。著者も不一致を報告しており、解消した根拠は示していない（[report.md:83](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RD/report.md:83)）。このCSVが入力検証を通ると設計書から決められない。
判定: 前提不成立
修正案: 列名の設計上の正解が確定するまで、このケースを削除する。確定後、採用された列名でCSVと手順を作り直す。

### 指摘2（重大度: Major）対象: IT-M04-09-RD005
主張: 入庫先の店舗Bについて、店舗A所属の承認者を選んで入庫承認申請・承認を行う。
実際: ケースとシードには店舗Aに属する所属・承認者しかなく、手順3もそれを選ぶ（[RD_test_cases.tsv:6](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RD_test_cases.tsv:6)、[RD_seed_data.tsv:2](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RD_seed_data.tsv:2)、[同:4](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RD_seed_data.tsv:4)）。設計書は承認通知先の所属を、編集する在庫を保持する店舗の所属から選ぶと定め、入庫承認申請では所属・メンバーを必須とする（[0202 HTML:2893](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:2893)、[同:3101](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:3101)）。店舗Bの入庫に使う通知先が準備されていない。
判定: 前提不成立
修正案: 店舗Bに属する所属と承認権限のあるメンバーをシードで用意し、入庫承認申請ではその所属・メンバーを選ぶ。

### 指摘3（重大度: Major）対象: 群RD
主張: 移動の入庫承認から在庫履歴へのケースは作っていない（[report.md:63](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/gen_RD/report.md:63)）。
実際: 設計書は入庫承認時の在庫増減・履歴登録を定め、別添資料に「在庫移動(加算)」を定義する。在庫履歴画面には登録元、変更前後在庫、増減数がある（[0202 HTML:3239](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:3239)、[同:8702](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:8702)、[同:5594](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:5594)）。既存ケース一覧にも、入庫承認を操作して在庫履歴画面を確認するケースはない。
判定: 取りこぼし
修正案: 入庫先の履歴に操作前は対象行がないことを確かめ、入庫承認後に店舗Bの在庫移動による加算履歴を確認するケースを追加する。RD005の前提を直したうえで、同じ移動経路を使える。

### 指摘4（重大度: Major）対象: 群RD
主張: 分割承認から分割先の在庫検索一覧への連携ケースは作っていない。
実際: M04-13 の設計書は承認時に分割先在庫数を加算し、総原価も更新すると明記する。在庫検索一覧は店舗・在庫区分別に在庫と総原価を表示する（[0202 HTML:4448](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:4448)、[同:1507](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:1507)、[同:1557](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:1557)）。RD002 は同じ承認を行うが、下流は在庫履歴画面である（[RD_test_cases.tsv:9](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/link_flow/cases/RD_test_cases.tsv:9)）。既存ケース一覧にも、この承認後に分割先の在庫検索一覧を確認するケースはない。
判定: 取りこぼし
修正案: 分割先の在庫検索一覧で操作前の在庫0・総原価0を確認し、分割登録・承認申請・承認後に同じ行の在庫と総原価の増加を確認するケースを追加する。

主張: `scenario_list.md:18`（UEV-03）は、キャンセル済みの申込が「マイイベント・デッキ登録の一覧から消え」るとする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3001-3002` は、一覧対象を「会員が申込したイベント(キャンセルしたものは除く）」と「会員がデッキを登録したイベント」としている。デッキ登録済みなら、申込をキャンセルしても一覧に残る。
判定: 事実の誤り
修正案: デッキ未登録なら一覧から消え、登録済みなら残ると終点を分ける。

主張: `scenario_list.md:17`（UEV-02）と `matrix_UEV-02/fl_table.tsv:9`（D2）は、申込後に「あとで」行うデッキ登録まで同じL2に含める。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:13` は「日をまたぎ、システムの状態が何かを待つもの（…後日の処理）は別の1本にする」と定める。`/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3005` には、申込後に一覧からデッキ登録画面へ進む導線がある。
判定: 切り方の誤り
修正案: 申込後に日をまたいでデッキ未登録の状態で待つ経路は、後日のデッキ登録を起点とする別のL2にする。

主張: `matrix_UEV-02/matrix.md:33` はEX8をT07に差し込むが、T07は「あとで…登録する」行である。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3007-3011` は、締切超過または「デッキ登録を終了する」が有効な場合、一覧のデッキ登録／編集を表示しないとしている。EX8の条件ではT07の後続登録を実行できない。
判定: 禁則の誤り
修正案: EX8はデッキを登録しない行に差し込み、後日の登録経路と組み合わせない。

主張: `matrix_UEV-06/matrix.md:25` は「会員でない参加者が会員登録を断る」EX1を、会員登録済みのT01に差し込む。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:66-68` は「会員登録されていない場合は、会員登録を促す」「拒否された場合は…終了する」とする。
判定: 禁則の誤り
修正案: EX1の差し込み条件を未登録の参加者に限定し、T01から外す。

主張: `matrix_UEV-06/matrix.md:14`（T02）は、未会員をオンライン申込リストで照会する行になっている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:2563` は申込対象を「ログイン会員の選手情報で申込可能なもの」に限る。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-EVENT-イベント受付実施-007_イベント受付～実施（会員登録に同意して参加）.md:8` も、未会員の当日受付では「オンライン申込一覧はこの参加者には使用しない」とする。
判定: 禁則の誤り
修正案: 未会員を申込リストに照会する組を除き、当日受付の経路で扱う。

主張: `matrix_UEV-06/matrix.md:18-19`（T06・T07）は、オンライン受付なしと「申込のときにすでにデッキを登録」を組み合わせる。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:37-40` はオンライン申込とその際のデッキ登録を記し、同ファイル`:69-70` は当日のデッキ登録を「オンライン受付時に登録済みの場合は除く」とする。
判定: 禁則の誤り
修正案: A2とD1を禁則に加え、T06・T07を成立する組へ置き換える。

主張: `matrix_UEV-06/matrix.md:14`（T02）は、当日になってデッキを登録する参加者についても、事前に全員分の登録デッキを出力する行になっている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:59-60` は全員分のデッキ出力を3-1に置き、同ファイル`:69-70` は当日のデッキ登録を後続の3-6に置く。T02の参加者のデッキは、3-1時点ではまだ存在しない。
判定: 禁則の誤り
修正案: 全員分の事前出力を期待する競技イベントの行では、対象者のデッキを出力前に登録済みとする。

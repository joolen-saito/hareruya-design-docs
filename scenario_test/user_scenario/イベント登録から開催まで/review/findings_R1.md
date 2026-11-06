主張: `matrix_UEH-01/fl_table.tsv:5`・`matrix_UEH-02/fl_table.tsv:5` のB2は申込直後にデッキを登録しない行だが、L4の `UEH-01_*.md:89`・`UEH-02_*.md:67` は開催日もデッキ登録を通さない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:69-70` は3-6で「当大会で使用したデッキを登録していただく」「※オンライン受付時に登録済みの場合は除く」とする。B2はこの除外条件に当たらない。
判定: 事実の欠落
修正案: B2の開催日にはデッキ登録の工程を入れ、登録できない設定や締切の場合はその分岐を明示する。

主張: `UEH-01_*.md:8,21-22` の代表行T05は2日程を申し込むが、同ファイル`:39,47-51` では1日程のデッキ登録と、日程を区別しない1回の受付・実施・ポイント付与で終わる。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0307_基本設計仕様書(フロント_イベント).html:2574` は「申込対象ごとに申込と申込選手を作成する」とする。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:61-71` にはイベント受付・実施・デッキ登録・ポイント付与の工程がある。T05の日程2について、開催側の工程を通したか確認できない。
判定: 事実の欠落
修正案: T05では日程2の開催側の工程も明記して確認するか、L4の代表行を1日程の行に変更する。

主張: `matrix_UEH-01/prohibitions.tsv:2-3`・`matrix_UEH-02/prohibitions.tsv:2-3` のX1・X2は、ルールが厳しいイベントとデッキ未登録・登録なしの組を「ありえない」として除外する。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0214_基本設計仕様書(イベント管理).html:1439,1684` は「ルール適用度」をイベントの単一選択、「デッキ登録あり」を日程のチェックボックスとして定める。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:60,65` も出力・確認の対象を「デッキ登録されたデッキ」「登録デッキ」としており、未登録の参加者や登録なしの設定を競技イベントから禁じていない。
判定: 禁則の誤り
修正案: X1・X2を外し、競技イベントで登録デッキがない場合の出力・確認の期待値を分ける。

主張: `scenario_list.md:74` は業務フロー18のパターン2をUEH-01・UEH-03に割り当て、開催前のデッキ提出を「2-1 デッキ登録」と扱う。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/18_デッキ登録.md:32-37` のパターン2は「オンライン入力されたデッキリストの公開」で、2-1は「入賞者にオンラインでデッキリストを登録してもらう」、2-2は入賞者のデッキを検索・更新して公開する工程である。UEH-01・03の開催前の参加者による提出は、この入賞後の工程を通らない。
判定: 事実の誤り
修正案: UEH-01・03の業務フロー18パターン2への割当を外し、開催後の入賞者の登録・公開はUDKのシナリオ参照にする。

主張: `scenario_list.md:18,60,89` と各L4の売上登録手順は、スマレジへの売上登録を「システムの外」とし、登録結果の期待値を置いていない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:72` は3-8を「スマレジに当日のイベント金額を登録する」とする。スマレジを操作する工程であり、`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/イベント管理/scenario_list.md:21` も終点を「当日のイベント金額がスマレジに登録される」としている。
判定: 事実の欠落
修正案: 3-8を外部システムであるスマレジの操作として扱い、登録した金額を確認する期待値を加える。

主張: `scenario_list.md:33,70-72` はUEH-03の起点を申込後の「デッキ登録／編集」押下としながら、イベント登録とオンライン申込のパターンもUEH-03が通ると割り当てる。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/08_イベント管理.md:27-40` ではイベント登録・日程登録・オンライン申込がデッキ登録より前の工程である。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:11-15` はL2を起点の業務イベントから完了までの単位とし、日をまたいで状態が待つ後日の処理は別の1本にすると定める。
判定: 切り方の誤り
修正案: UEH-03を後日のデッキ登録を起点とするシナリオに統一し、先行するイベント登録・申込は実行用の準備として扱ってパターン割当から外す。

主張: `デッキ登録/matrix_UDK-02/exceptions.tsv:9-10` の EX8・EX9 は、表示されないはずの「デッキ登録」ボタンを押して登録画面を開く手順にしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0306_基本設計仕様書(フロント_会員).html:3008-3011` は「デッキ登録/編集」は登録終了または登録あり未チェックの場合に「表示しない」と定める。この条件では記載された押下操作を実行できない。
判定: 切り方の誤り
修正案: EX8・EX9は一覧と申込完了画面を開いてボタンが出ないことを確認する手順に直す。

主張: `デッキ登録/scenario_list.md:18` の UDK-03 と `網羅マトリクス/デッキ登録/cond_map.tsv:59` は、ルール適用度が強なら「提出内容が実際のデッキと一致している」と断定している。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/18_デッキ登録.md:34-36` は、大会時に確認するため「高精度で登録できている」と述べるだけで、必ず一致するとは書いていない。
判定: 根拠の捏造
修正案: 一致を保証する記述を外し、強の大会でも提出内容を確認したうえで必要なら訂正する手順にする。

主張: `店頭買取/scenario_list.md:26` の UKA-09 は、CSV登録と入庫済みボタンの「どちらを正とするか」を判断待ちにしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0205_基本設計仕様書(店頭買取管理).html:1673-1678` は「入庫処理を終えた際に押下し、入庫済みステータスにする」と入庫済みボタンの操作を定める。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:78` は、業務フローと設計書が食い違うときは設計書を優先すると定める。
判定: 事実の誤り
修正案: 入庫済みボタンを設計書上の正とし、CSV経路との食い違いは判断待ちではなく食い違いとして記録する。

主張: `ネット買取/scenario_list.md:18` の UNK-03 と `網羅マトリクス/ネット買取/cond_map.tsv:82` は、「価格が付くかもしれない」カードを査定に通すとだけ書き、そのカードについての期待値を示していない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/14_ネット買取.md:58-65` は対象カードを査定に通した後、「査定した査定金額が挿入される」「カード買取情報が表示される」と記す。追加文のままでは、その値のカードが査定結果に反映されたか確かめられない。
判定: 事実の欠落
修正案: 該当カードを識別できる試験データを使い、そのカードの査定情報と金額が結果に出ることを個別の期待値に書く。

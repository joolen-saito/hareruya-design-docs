主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/step_map.tsv:125` は、tobe版 R95「リコメンドファイル作成」を UZK-06 が通るとする。
実際: `hareruya-design-docs/scenario_test/markdown/13_在庫管理_tobe.md:62-63` は「リコメンドファイル作成を行う」「※マクロなど使用している」とする。`hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:21` の UZK-06 は在庫リコメンドを在庫移動の起点に挙げるだけで、ファイル作成を通さない。
判定: 偽の○
修正案: R95 の UZK-06 対応を外し、前巡で同型の R202 に適用した「システムの外」の扱いを確認する。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/cond_map.tsv:14-15` は B4-1「突発的な事象」と B4-2「希少なカードの仕入れ」を、ともに UPC-04 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:19` は「きっかけ：突発の事象（大会後・新商品発表・禁止改定・トレンドの変化）／希少なカードを仕入れた場合」と L3 に列挙するだけで、どちらの起点を設定した行もない。
判定: 偽の○
修正案: 両値の UPC-04 対応を外し、起点別の実行を確認できない値は抜けとする。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/cond_map.tsv:31-32` は D6-1「商品単位」と D6-2「カテゴリ単位」の売上分析を、ともに UPC-02 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:17` の根拠は L3 の「集計単位：商品／カテゴリ（受注/売上分析）」という選択肢の列挙であり、各単位を選んで集計した手順や行はない。
判定: 偽の○
修正案: D6-1・D6-2 の UPC-02 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/価格管理/cond_map.tsv:33-34` は D7-1「EC＋TC東京」と D7-2「全支店」の販売数列を、ともに UPC-03 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/価格管理/scenario_list.md:18` は「販売数の列：EC＋TC東京／全支店のECスマレジ販売数（支店）」を L3 に列挙するだけで、各列の値を用意して参照・判定する行はない。
判定: 偽の○
修正案: D7-1・D7-2 の UPC-03 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/商品登録・編集/cond_map.tsv:63-65` はリーガリティ D8-1「使用可」・D8-2「制限」・D8-3「禁止」を、すべて UPR-10 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:27` は状態を「使用可⇔制限・禁止」とまとめて記すだけで、三つの値をそれぞれ設定・確認する行はない。
判定: 偽の○
修正案: D8-1〜D8-3 の UPR-10 対応を外し、値別に通した根拠があるものだけ○にする。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/商品登録・編集/cond_map.tsv:84-85` は N5-1「スマレジ連携しない」と N5-2「連携する」を、ともに UPR-06 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:23` は「規格のスマレジ連携フラグ：連携しない／連携する」を L3 に列挙するだけで、各フラグを設定して結果を確かめる行はない。
判定: 偽の○
修正案: N5-1・N5-2 の UPR-06 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/商品登録・編集/cond_map.tsv:88-89` は N8-1「部門登録画面」と N8-2「部門CSV入力」を、ともに USM-10 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/スマレジ連携/scenario_list.md:124` は「操作：部門登録（画面）／部門CSV入力／部門更新CSV登録」と手段を列挙するだけで、画面登録と CSV 入力をそれぞれ実行した行はない。
判定: 偽の○
修正案: N8-1・N8-2 の USM-10 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:134-135` は D27-1「画面」と D27-2「棚卸詳細登録CSV」の双方を UZK-09 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:24` は「棚卸商品の登録は画面／棚卸詳細登録CSV」と登録手段を列挙するだけで、それぞれを使った行はない。
判定: 偽の○
修正案: D27-1・D27-2 の UZK-09 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:136-137` は D28-1「在庫確認画面」と D28-2「棚卸商品数量登録CSV」の双方を UZK-10 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:25` は「数量の登録は在庫確認の画面／棚卸商品数量登録CSV」と手段を列挙するだけで、それぞれの登録を実行した行はない。
判定: 偽の○
修正案: D28-1・D28-2 の UZK-10 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:138-142` は D29-1〜D29-5 の五つの在庫反映不可条件を、すべて UZK-10 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:25` は「反映できない場合（在庫反映済み・商品数0・計上済み0・数が合わない・差異が未確認）」と条件名を列挙するだけで、各条件のデータを用意して反映不可を判定する行はない。
判定: 偽の○
修正案: D29-1〜D29-5 の UZK-10 対応を外す。

主張: `hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/在庫管理/cond_map.tsv:143-144` は D30-1「画面」と D30-2「CSV」による分割先登録を、ともに UZK-03 が通るとする。
実際: `hareruya-design-docs/scenario_test/user_scenario/在庫管理/scenario_list.md:18` は「分割先の登録は画面／分割先商品CSV登録」と選択肢を列挙するだけで、両手段を実行した行はない。
判定: 偽の○
修正案: D30-1・D30-2 の UZK-03 対応を外す。

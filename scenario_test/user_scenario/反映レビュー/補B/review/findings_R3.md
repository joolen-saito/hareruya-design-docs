主張: `網羅マトリクス/商品登録・編集/factors.tsv:96` の N9-2 を対象に戻したが、値は「高額商品」をフィードに載らない商品としている。一方、追加した `cond_map.tsv:98` の確認対象は「高額商品でないNM以外の規格」になっている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1504` は「（高額商品の場合）状態関係なく高額商品コードが設定されているもの」を取得条件とする。
判定: 事実の誤り
修正案: N9-2 の値から「高額商品」を除外条件として扱う記述を外し、高額商品コードの有無による条件に直す。

主張: `スマレジ連携/scenario_list.md:117` の USM-03・D13-2 は、一括連携後の在庫数一致だけを確かめ、結果通知を待つ間のEC在庫と通知後の更新を確かめない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0501_基本設計仕様書(API_在庫管理).html:1034` は「この段階では…ECCUBE側の在庫変動処理は行わない」、`:1037` は結果が「非同期で返ってくる」後にEC側の在庫を更新すると定める。
判定: 事実の欠落
修正案: D13-2 に、結果通知前はEC在庫を変えず、成功通知後に更新する確認を足す。

主張: `網羅マトリクス/在庫管理/cond_map.tsv:123,136` は、UZK-09・B21-1 と UZK-12・B15-1 をシナリオで通る値として対応付けているが、追加手順自身がシステムの外の確認、またはシステム状態が変わらない対応としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/12_在庫管理.md:255` は「カードがあればお客様に確認し、対応完了」、`:311` は棚卸範囲のカードが含まれないか「確認してもらう」とする。`/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/AUTHORING.md:17` はシステムを触らない作業を「システムの外」とする。
判定: 切り方の誤り
修正案: B21-1 と B15-1 はシステムの外の分岐として扱い、シナリオで通る値としての対応を外す。

主張: `matrix_UPR-02/fl_table.tsv:9` の D2「購入上限数を設定しない」を正常な水準とし、`matrix.md:14,15,18` に採用している。
実際: `scenario_test/markdown/10_商品登録・編集_tobe.md:71` は「予約商品なので購入上限数も規格にて登録する」と定める。CSV列が任意でも、この業務フローでは登録する。
判定: 禁則の誤り
修正案: D2を予約シングル登録の正常な組み合わせから外す。

主張: `matrix_UPR-09/exceptions.tsv:4` の E3は、B2の行に「変更前が廃止」を差し込み、カード・グッズ商品CSVでも「廃止の商品は変更されない」とする。
実際: `ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:864-865` と `ProductGoodsImportHandler.php:819-820` は、両CSVで「廃止された商品も更新可能にするため」除外しないと明記する。スキップ処理があるのは別機能の `ProductStatusUpdateImportHandler.php:82-85`。また、E3の前提「廃止」は `matrix_UPR-09/fl_table.tsv:4-7` の変更前の水準に無い。
判定: 事実の誤り
修正案: E3の差し込み条件と期待値をカード・グッズ商品CSVの経路に合わせて直し、設計書の変更禁止との食い違いを記録する。

主張: `scenario_list.md:23,68,70` は、UPR-06が必ず「（新規）→非公開→公開」を通るとする。
実際: `excel_to_html/output/0204_基本設計仕様書(商品管理).html:1943` はカード商品CSVの選択肢に「公開」を含め、同`:1984,1988` は新規商品と規格をCSVで登録するとする。新規CSVで直接公開する経路もある。
判定: 事実の誤り
修正案: 非公開を経由する場合と、新規CSVで直接公開する場合を分岐として書く。

主張: `scenario_list.md:57` は、2-1〜2-3のカードリスト・画像・画像パス対応表作成を「UPR-02の起点の前の作業」とする。
実際: `scenario_test/markdown/10_商品登録・編集_tobe.md:41-47` は公式カードリスト公開を2-1の開始時点とし、その後にリスト・画像・対応表を作ると記す。
判定: 事実の誤り
修正案: 2-1〜2-3をUPR-02の起点後に行う「システムの外」の作業として位置付ける。

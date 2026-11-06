主張: `matrix_UPR-09/README.md:21` は、本店の商品公開ステータスを「非公開」に変えるとスマレジ連携が外れるとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:1963,2378` は非公開時の連携解除を定める。一方、新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:714-722` は既存の連携フラグを維持でき、`ProductGoodsImportHandler.php:750-757` も「廃止」以外ではCSVのフラグを使う。公開状態の列だけを変えるUPR-09では、連携済み商品を非公開にしても連携が残りうる。
判定: 事実の誤り
修正案: 非公開時の連携解除を設計書と新実装の食い違いに記録し、連携済み商品を非公開にする分岐をUPR-09のL3に加える。

主張: `scenario_list.md:25` のUPR-08は、在庫が残る場合の制約を「廃止」にだけ記し、公開から非公開への切り替えを通常の経路としている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Controller/Admin/Product/ProductController.php:455-465` は「非公開・廃止にする場合、EC-CUBE・スマレジのいずれかに在庫があれば変更できない」とし、公開から非公開への変更にもエラーを付ける。
判定: 事実の欠落
修正案: UPR-08に在庫が残る商品の非公開化エラーを加え、設計書に記載のない新実装の制約として記録する。

主張: `scenario_list.md:18` のUPR-01は、予約BOXのCSV値の組をUPR-02のマトリクスで見るとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/10_商品登録・編集_tobe.md:173-175` のBOX登録経路は「グッズ商品CSV登録」を通る。`matrix_UPR-02/fl_table.tsv:4-9` の公開状態・カテゴリ因子は「カード商品CSV」用で、グッズ商品CSVの因子は `matrix_UPR-04/fl_table.tsv:7-12` にある。
判定: 事実の誤り
修正案: UPR-01の参照先をグッズ商品CSVの組み合わせに直し、予約BOX固有の値がそこで扱えるか確認する。

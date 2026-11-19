- 主張：[UPR-02 の L3](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:19) は F2・F3 なら常に「連携しない」、商品コードも採番されないとする。[組み合わせ表](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/matrix_UPR-02/matrix.tsv:5) では T04・T05 に登録済みカードの更新を割り当てている。
- 実際：[新実装](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:710) は「既に連携済みの規格を連携条件の変化だけで停止しない」とし、既存の連携フラグを保持する。[商品コードも保持する](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductCardImportHandler.php:1006)。したがって T04・T05 の既存規格が連携済みなら、記載の期待値にならない。F1 の T06 も既存コードがあれば再採番しない。
- 判定：事実の誤り
- 修正案：更新行の既存連携状態を前提に定め、連携済みなら保持する期待値に直す。自動判定だけを確かめる行は、既存規格を未連携に限定する。

### 指摘2
- 主張：[USH-03 の終点と状態の欄](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/scenario_list.md:18) に、CSV・PDF、本店・支店別の棚番順、複数の価格区分、3種類の在庫移動状態が残り、[状態の網羅表](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/scenario_list.md:55) も3状態を通すとしている。
- 実際：[同じ行の L3](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/仕入れ業務/scenario_list.md:18) は、組み合わせ表を外した後の1本を「移動中」の戻しリストCSVに限定する。[レビュー指摘](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/review/レビュー指摘_2026-11-18.md:35) に従って外した店舗・商品種類・価格区分の違いと、代表外の形式・状態まで「目で確かめる結果」として残っている。
- 判定：取り残し
- 修正案：終点と状態の網羅表を、実施する「移動中・CSV」の1本で確かめる結果に合わせる。

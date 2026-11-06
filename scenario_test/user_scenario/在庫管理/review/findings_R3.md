主張: `scenario_list.md:62` は業務フロー13のパターン1「新商品入荷時インポート作業」の対応シナリオを、既存商品を扱うUZK-02だけとしている。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/markdown/13_在庫管理_tobe.md:12` は「新商品入荷時インポート作業」。成果物の`scenario_list.md:16-17`でもUZK-01を「新商品」、UZK-02を「既存商品」と区別している。
判定: 事実の欠落
修正案: パターン13-1のシナリオ欄にUZK-01を追加する。

主張: `matrix_UZK-07/matrix.md:20-21` のT08・T09は、過剰分を負の差分点数として差分CSVで登録する組み合わせだが、`scenario_list.md:134-146` の食い違い欄にCSVの入力制限との矛盾がない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:3135` は「追加の場合…負の数」とし、同じシートの`:3177` は差分CSVの差分点数を「1～99999999」とする。
判定: 事実の欠落
修正案: 負数を要する過剰差分とCSVレイアウトの入力制限との矛盾を、設計書との食い違いに記録する。

主張: `scenario_list.md:23` のUZK-08は「欠品あり」をL3に含める一方、`:134-146` は店舗内移動の欠品履歴に関する設計書と実装の食い違いを記録していない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0202_基本設計仕様書(在庫管理機能).html:2992` は「欠品分の在庫を一度戻してから欠品分減らし、在庫変動履歴を登録する」。依頼者の裁定 `/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md:24` は「店舗内移動では、実装が欠品の2行の履歴を作らない」と明記する。
判定: 事実の欠落
修正案: UZK-08の欠品あり経路について、設計書が求める履歴と実装の差を食い違い欄に記録する。

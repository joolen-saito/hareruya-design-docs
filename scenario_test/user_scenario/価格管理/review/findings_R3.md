主張: `scenario_list.md:78,91` と `matrix_UPC-01/README.md:25` は、セール用CSVでスマレジ連携フラグを自動でONにするか「判断待ち」とする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:5950` は「条件を満たす場合スマレジ連携フラグを有効とする」、同`:7984` はセール用価格変更CSV登録について「シングルカードのみスマレジ連携フラグ自動判定追加」と明記する。同`:7866` の「セール価格は連携しない」は価格の連携についての注記である。
判定: 事実の誤り
修正案: 自動ONは設計書の期待値に確定し、セール価格をスマレジへ送るかどうかとは分けて記録する。

主張: `matrix_UPC-01/README.md:20-21` は販売価格を「CSVの販売価格」とし、`fl_table.tsv:8-9` の因子DもCSV値の299円以下／300円以上で区切る。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:6036` は「行の販売価格に規格の割引率を掛け、10円単位に切り上げた額」とする。新実装の `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Csv/Importer/Event/ProductPriceImportHandler.php:382-385,469-471` も換算後の販売価格を連携判定に使う。CSV値が299円でも換算後に300円となる組がある。
判定: 事実の誤り
修正案: 規格別の換算後価格を期待値と連携判定の境界に使い、割引率と10円単位の切り上げを水準に反映する。

主張: `scenario_list.md:16` と `matrix_UPC-01/fl_table.tsv:2-9` は、セール用CSV取込のL3にタグ列と帯URL列の分岐を持たない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:6039-6043` は「タグ列が空の行では、その商品のタグは全件が消える」「帯URLの列が空の行では、対象規格の帯URLを未設定にする」とする。
判定: 事実の欠落
修正案: UPC-01のL3に、タグと帯URLの指定・空欄による更新結果を加える。

主張: `scenario_list.md:22` のUPC-07は、セール中のお気に入りの有無だけを通知対象の分岐とし、お気に入り登録時の言語を扱わない。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1378` は「お気に入りは商品と言語の組で保持し、セール中かどうかもその組で判定する。お気に入りに登録した言語の側がセール中である商品だけが通知の対象になる」とする。
判定: 事実の欠落
修正案: UPC-07のL3に、登録した言語側だけがセール中の場合と別言語側だけがセール中の場合を加える。

主張: `scenario_list.md:23,65` のUPC-08は、バッチで期間別販売数が更新される状態だけを書く。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1078` は「集計対象期間に受注明細が1件も無かった集計単位は更新の対象にならず、前回までの販売数がそのまま残る（0にはならない）。集計結果が1件も無いときは何も更新しない」とする。
判定: 事実の欠落
修正案: UPC-08のL3と状態遷移表に、対象明細なしでは前回値を保持し、集計結果が全件なしなら更新しない分岐を加える。

主張: `scenario_list.md:23` のUPC-08は、全期間の販売数が「前日までの受注」で新しくなるとする。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0404_基本設計仕様書(バッチ_商品管理).html:1076` は「前日は実行日の前日1日分だけを数える。それ以外の期間は…実行日当日の受注も含む」とし、同`:1080` は再実行時に集計し直すとする。
判定: 事実の誤り
修正案: 前日分とその他の期間で対象日を分け、当日受注が存在する時点での再実行をL3に加える。

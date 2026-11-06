主張: `店頭受取受注管理/matrix_UOR-01/README.md:19` は、支店で変わる表示を「合計のみ」としている。
実際: `/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Resource/template/default/Shopping/index.twig:837-840` は、支店で合計に加え「内税」の額を表示する。`店頭受取受注管理/scenario_list.md:76` もこの食い違いを記録している。
判定: 事実の誤り
修正案: README の支店表示を「合計と内税」に直す。

主張: `通販/scenario_list.md:106` は、注文するボタンの「基本の文言の定めが無い」としている。
実際: `/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1303` は「支払方法によって『注文する』ボタンの文言を変更する」と記し、同ファイル:1734 の項目名も「注文するボタン」である。
判定: 事実の誤り
修正案: 基本の文言「注文する」は設計書にあり、支払方法による変更後の文言だけを別途確認する記述に直す。

主張: `店頭受取受注管理/legal_check.md:37` の LO-07 は、参照先で必要事項を読めるかを確かめるが、最終確認画面に参照対象の表示事項が示されるかを確認項目にしていない。
実際: `/home/y-saito/Developments/hareruya-design-docs/scenario_test/外部資料観点/evidence.tsv:488` は「最終確認画面に参照の対象となる表示事項及びその参照箇所又は参照方法を明示した上で」とする。
判定: 事実の欠落
修正案: LO-07 に、最終確認画面上で参照対象の事項と参照方法が分かるかの確認を加える。

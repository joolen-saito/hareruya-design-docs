- 主張：[UOR-02 の因子C4](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/matrix_UOR-02/fl_table.tsv:11) は「免税対象の商品」全般を水準にし、[README](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/店頭受取受注管理/matrix_UOR-02/README.md:18) は受注の「免税額」が取引の「内税商品の一般品免税額」になるとしている。
- 実際：[0204 部門登録](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0204_基本設計仕様書(商品管理).html:4798) の免税区分には「1:一般品、2:消耗品」がある。一方、[0505 スマレジ受信処理](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0505_基本設計仕様書(API_受注管理).html:1641) が示す項目は「内税商品の一般品免税額」で、新実装も[その項目だけを受注の免税額に設定する](/home/y-saito/Developments/ec-cube-enterprise/src/Eccube/Service/Smaregi/Webhook/Transaction/SmaregiOrderFactory.php:370)。現行の水準名では消耗品を選べるため、期待値を一般品以外に広げている。
- 判定：根拠なし（捏造）
- 修正案：C4 の試験商品を「一般品」に限定し、期待値にも明記する。

### 指摘2
- 主張：[UPR-02 の test_map](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/網羅マトリクス/商品登録・編集/test_map.tsv:36) は追加された T07・T08 に A3-1「カード詳細が1件に決まる」の〇を付けながら、備考を「T01〜T06の取り込みはすべて…」のままにし、引用には「未登録のカード」を使っている。
- 実際：[組み合わせ表](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/matrix_UPR-02/matrix.tsv:8) は T07・T08 まである。[シナリオ本文](/home/y-saito/Developments/hareruya-design-docs/scenario_test/user_scenario/商品登録・編集/scenario_list.md:19) も「T01〜T08の取り込みはすべてこれ」とし、A3-1 の前提を「カード詳細IDが…1件に決まる行だけ」と書く。「未登録のカード」はカード登録の状態であり、カード詳細が1件に決まる根拠ではない。
- 判定：整合の崩れ
- 修正案：A3-1 の8行の備考を T01〜T08 に直し、引用を本文の「カード詳細IDが…1件に決まる行だけ」に替える。

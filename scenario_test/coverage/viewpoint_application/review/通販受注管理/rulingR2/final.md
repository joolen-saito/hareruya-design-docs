### 指摘 1
- 対象: SCN-TSUHAN-お客様EC購入フロー-001
- 主張: メインフローの工程5・6に、コンビニ決済の別メールと、代金引換・振込を含む支払方法の分岐がある。
- 実際: [シナリオ:69](/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-TSUHAN-お客様EC購入フロー-001_お客様EC購入フロー（原典実線の代表経路）.md:69) は「コンビニ決済の場合」、同:70 は「クレジットカード・代金引換以外の場合、振込や入金手続きが必要」と記す。[裁定:7](/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/review/通販受注管理/rulings.md:7) はこれらの支払方法を除外している。実行手順の工程5・6は修正済み。
- 判定: 事実の誤り
- 修正案: メインフローの工程5・6から旧支払方法とその分岐を除く。

### 指摘 2
- 対象: STI-TSUHAN-EC-001-005・009 / SCN-TSUHAN-お客様EC購入フロー-001
- 主張: クレジットカード購入の工程4は「購入内容を確定して注文完了画面を表示する」とだけ記す。
- 実際: [シナリオ:79](/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/SCN-TSUHAN-お客様EC購入フロー-001_お客様EC購入フロー（原典実線の代表経路）.md:79) と[項目:633](/home/y-saito/Developments/hareruya-design-docs/scenario_test/test_items/STI-TSUHAN-お客様EC購入フロー-001_お客様EC購入フロー（原典実線の代表経路）_test_items.md:633) に「クレジットカード決済へ」を押す操作とカード情報入力がない。[0304:1304](/home/y-saito/Developments/hareruya-design-docs/excel_to_html/output/0304_基本設計仕様書(フロント_注文).html:1304) はカード決済時のボタンを「クレジットカード決済へ」と定める。
- 判定: 抜け
- 修正案: 001の購入確定手順に、同ボタンからカード情報入力を経て決済を完了する操作を記す。

### 指摘 3
- 対象: 判定台帳 SV-01-10・SV-13-05・SV-17-02 ほか
- 主張: 現行の通販シナリオ全体を「22本」と記す。
- 実際: [台帳:11](/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/通販受注管理.tsv:11) は対象欄を「22本すべて」とし、[台帳:97](/home/y-saito/Developments/hareruya-design-docs/scenario_test/coverage/viewpoint_application/通販受注管理.tsv:97) も「全22シナリオ」と記す。同型の対象欄は計13行に残る。[シナリオ一覧:65](/home/y-saito/Developments/hareruya-design-docs/scenario_test/scenario/all_scenarios.tsv:65) から同:88 までの通販行は24本。
- 判定: 判定の誤り
- 修正案: 台帳で現行全件を指す「22本」と出典欄の「22行」を24に直す。

合計3件。
